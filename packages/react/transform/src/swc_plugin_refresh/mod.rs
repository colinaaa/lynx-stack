use std::collections::{HashMap, HashSet};

use swc_core::{
  atoms::Atom,
  common::{SyntaxContext, DUMMY_SP},
  ecma::{
    ast::{
      AssignExpr, Callee, ComputedPropName, Expr, ExprOrSpread, Function, Id, Ident, ImportDecl,
      ImportSpecifier, Lit, MemberExpr, ModuleExportName, ObjectPatProp, Tpl, TplElement,
      VarDeclarator,
    },
    visit::{VisitMut, VisitMutWith},
  },
  quote,
};

use crate::calc_hash;

#[napi(object)]
#[derive(Clone, Debug, Default)]
pub struct RefreshVisitorConfig {
  pub library: Option<Vec<String>>,
}

#[derive(Debug)]
pub struct RefreshVisitor {
  config: RefreshVisitorConfig,
  file_hash: String,
  parent_key: String,
  param_key: String,
  counter: HashMap<String, usize>,
  local: HashSet<Id>,
  lib_local: HashSet<Id>,
}

impl RefreshVisitor {
  pub fn new(config: RefreshVisitorConfig, file_hash: String) -> Self {
    Self {
      config,
      file_hash,
      parent_key: Default::default(),
      param_key: Default::default(),
      counter: Default::default(),
      local: Default::default(),
      lib_local: Default::default(),
    }
  }
}

impl RefreshVisitor {
  fn is_from_lib(&self, mem: &MemberExpr) -> bool {
    let Some(root) = mem.obj.as_ident() else {
      return false;
    };
    if !self.lib_local.contains(&root.to_id()) {
      return false;
    }

    // xxx["createContext"]
    if mem.prop.is_computed() {
      let Some(ComputedPropName { expr, .. }) = mem.prop.as_computed() else {
        return false;
      };
      let Expr::Lit(Lit::Str(lit)) = expr.as_ref() else {
        return false;
      };
      lit.value == "createContext"
    } else {
      // xxx.createContext
      mem
        .prop
        .as_ident()
        .is_some_and(|id| id.sym == "createContext")
    }
  }
}

impl VisitMut for RefreshVisitor {
  fn visit_mut_import_decl(&mut self, import_decl: &mut ImportDecl) {
    let import_from = import_decl.src.value.to_string();
    let is_library = self
      .config
      .library
      .as_ref()
      .unwrap_or(&vec![
        "@lynx-js/react".into(),
        "preact".into(),
        "react".into(),
      ])
      .contains(&import_from);

    if !is_library {
      return;
    }

    for spec in &import_decl.specifiers {
      match spec {
        ImportSpecifier::Default(spec) => {
          self.lib_local.insert(spec.local.to_id());
        }
        ImportSpecifier::Named(spec) => {
          if let Some(imported) = &spec.imported {
            let name = match imported {
              ModuleExportName::Ident(ident) => &ident.sym,
              ModuleExportName::Str(str) => &str.value,
            };
            if name == "createContext" {
              self.local.insert(spec.local.to_id());
            }
          } else if spec.local.sym == "createContext" {
            self.local.insert(spec.local.to_id());
          }
        }
        ImportSpecifier::Namespace(spec) => {
          self.lib_local.insert(spec.local.to_id());
        }
      }
    }
  }

  fn visit_mut_expr(&mut self, expr: &mut Expr) {
    let Expr::Call(call_expr) = expr else {
      expr.visit_mut_children_with(self);
      return;
    };

    let is_create_context = match &call_expr.callee {
      Callee::Expr(expr) => match expr.as_ref() {
        Expr::Ident(id) => self.local.contains(&id.to_id()),
        Expr::Member(mem) => self.is_from_lib(mem),
        _ => false,
      },
      _ => false,
    };

    if !is_create_context {
      call_expr.visit_mut_children_with(self);
      return;
    }

    let mut cnt = *self.counter.entry(self.parent_key.clone()).or_insert(0);
    cnt += 1;
    self.counter.insert(self.parent_key.clone(), cnt);

    let context_id = format!(
      "{}{}{}{}",
      self.file_hash, self.parent_key, cnt, self.param_key
    );

    let parts = context_id.split("_PARAM").collect::<Vec<&str>>();
    let exprs = parts
      .iter()
      .skip(1)
      .map(|str| {
        Box::new(Expr::Ident(Ident {
          ctxt: SyntaxContext::default(),
          span: DUMMY_SP,
          sym: Atom::from(str.replace('}', "").to_string()),
          optional: false,
        }))
      })
      .collect::<Vec<_>>();

    let mut quasis = vec![TplElement {
      span: DUMMY_SP,
      tail: false,
      cooked: None,
      raw: Atom::from(
        parts
          .first()
          .expect("Should have at lease on part")
          .to_string(),
      ),
    }];
    quasis.extend(
      exprs
        .iter()
        .map(|_| TplElement {
          span: DUMMY_SP,
          tail: false,
          cooked: None,
          raw: Atom::from(""),
        })
        .collect::<Vec<_>>(),
    );

    let create_context_expr = call_expr
      .callee
      .as_expr()
      .expect("Should convert callee to expr")
      .as_ref()
      .clone();
    let ident_expr = Expr::Tpl(Tpl {
      span: DUMMY_SP,
      exprs,
      quasis,
    });

    let replacement = if let Some(ExprOrSpread { expr, spread: None }) = call_expr.args.first() {
      quote!(
        "Object.assign(($create_context[$ident] || ($create_context[$ident]=$create_context($value))), {__:$value})" as Expr,
        create_context: Expr = create_context_expr,
        ident: Expr = ident_expr,
        value: Expr = expr.as_ref().clone()
      )
    } else {
      quote!(
        "($create_context[$ident] || ($create_context[$ident]=$create_context()))" as Expr,
        create_context: Expr = create_context_expr,
        ident: Expr = ident_expr,
      )
    };

    *expr = replacement;
  }
  fn visit_mut_object_pat_prop(&mut self, obj_pat_prop: &mut ObjectPatProp) {
    let key = obj_pat_prop
      .as_key_value()
      .and_then(|kv| kv.key.as_str())
      .map(|s| s.value.to_string())
      .unwrap_or_default();

    if key.is_empty() {
      obj_pat_prop.visit_mut_children_with(self);
    } else {
      let old_key = self.parent_key.clone();
      self.parent_key = format!("__{key}");
      obj_pat_prop.visit_mut_children_with(self);
      self.parent_key = old_key;
    }
  }
  fn visit_mut_var_declarator(&mut self, var_declarator_expr: &mut VarDeclarator) {
    let key = var_declarator_expr
      .name
      .as_ident()
      .map(|id| id.sym.to_string())
      .unwrap_or_default();

    if key.is_empty() {
      var_declarator_expr.visit_mut_children_with(self);
    } else {
      let old_key = self.parent_key.clone();
      self.parent_key = format!("${key}");
      var_declarator_expr.visit_mut_children_with(self);
      self.parent_key = old_key;
    }
  }
  fn visit_mut_assign_expr(&mut self, assign_expr: &mut AssignExpr) {
    let key = assign_expr
      .left
      .as_ident()
      .map(|id| id.sym.to_string())
      .unwrap_or_else(|| calc_hash(&format!("{:?}", assign_expr.left))); // used getSource() in babel

    if key.is_empty() {
      assign_expr.visit_mut_children_with(self);
    } else {
      let old_key = self.parent_key.clone();
      self.parent_key = format!("_{key}");
      assign_expr.visit_mut_children_with(self);
      self.parent_key = old_key;
    }
  }

  fn visit_mut_function(&mut self, func: &mut Function) {
    let key = func
      .params
      .iter()
      .filter_map(|p| p.pat.as_ident().map(|id| id.sym.to_string()))
      .collect::<Vec<String>>()
      .join("_PARAM");

    if key.is_empty() {
      func.visit_mut_children_with(self);
    } else {
      let old_key = self.param_key.clone();
      self.param_key = format!("__PARAM{key}");
      func.visit_mut_children_with(self);
      self.param_key = old_key;
    }
  }
}

#[cfg(test)]
mod tests {
  use swc_core::{
    common::Mark,
    ecma::{
      parser::{EsSyntax, Syntax},
      transforms::{base::resolver, testing::test},
      visit::visit_mut_pass,
    },
  };

  use crate::{RefreshVisitor, RefreshVisitorConfig};

  test!(
    module,
    Syntax::Es(EsSyntax {
      jsx: true,
      ..Default::default()
    }),
    |_| (
      resolver(Mark::new(), Mark::new(), true),
      visit_mut_pass(RefreshVisitor::new(
        Default::default(),
        "__file_hash__".into()
      ))
    ),
    should_handle_basic,
    r#"
    import { createContext } from '@lynx-js/react';

    export function aaa() {
      const context = createContext();
    }
    "#
  );

  test!(
    module,
    Syntax::Es(EsSyntax {
      jsx: true,
      ..Default::default()
    }),
    |_| (
      resolver(Mark::new(), Mark::new(), true),
      visit_mut_pass(RefreshVisitor::new(
        RefreshVisitorConfig {
          library: Some(vec!["@custom/react".into()])
        },
        "__file_hash__".into()
      ))
    ),
    should_handle_custom_library,
    r#"
    import { createContext } from '@custom/react';

    export function aaa() {
      const context = createContext();
    }
    "#
  );

  test!(
    module,
    Syntax::Es(EsSyntax {
      jsx: true,
      ..Default::default()
    }),
    |_| (
      resolver(Mark::new(), Mark::new(), true),
      visit_mut_pass(RefreshVisitor::new(
        Default::default(),
        "__file_hash__".into()
      ))
    ),
    should_handle_import_default,
    r#"
    import pp from '@lynx-js/react';

    export function aaa(a, b) {
      const context = pp.createContext();
    }
    "#
  );

  test!(
    module,
    Syntax::Es(EsSyntax {
      jsx: true,
      ..Default::default()
    }),
    |_| (
      resolver(Mark::new(), Mark::new(), true),
      visit_mut_pass(RefreshVisitor::new(
        Default::default(),
        "__file_hash__".into()
      ))
    ),
    should_handle_import_computed,
    r#"
    import pp from '@lynx-js/react';

    export function aaa(a, b) {
      const context = pp["createContext"]();
    }
    "#
  );

  test!(
    module,
    Syntax::Es(EsSyntax {
      jsx: true,
      ..Default::default()
    }),
    |_| (
      resolver(Mark::new(), Mark::new(), true),
      visit_mut_pass(RefreshVisitor::new(
        Default::default(),
        "__file_hash__".into()
      ))
    ),
    should_handle_import_named_computed,
    r#"
    import { createContext as cc } from '@lynx-js/react';

    export function aaa() {
      const context = cc();
    }
    "#
  );

  test!(
    module,
    Syntax::Es(EsSyntax {
      jsx: true,
      ..Default::default()
    }),
    |_| (
      resolver(Mark::new(), Mark::new(), true),
      visit_mut_pass(RefreshVisitor::new(
        Default::default(),
        "__file_hash__".into()
      ))
    ),
    should_handle_import_namespace_computed,
    r#"
    import * as pp from '@lynx-js/react';

    export function aaa() {
      const context = pp.createContext();
    }
    "#
  );

  test!(
    module,
    Syntax::Es(EsSyntax {
      jsx: true,
      ..Default::default()
    }),
    |_| (
      resolver(Mark::new(), Mark::new(), true),
      visit_mut_pass(RefreshVisitor::new(
        Default::default(),
        "__file_hash__".into()
      ))
    ),
    should_handle_local_ident,
    r#"
    import { createContext } from "@lynx-js/react";
    export function aaa() {
      function createContext() { }
      const context = createContext();
    }

    export function bbb() {
      const context = createContext();
    }
    "#
  );

  test!(
    module,
    Syntax::Es(EsSyntax {
      jsx: true,
      ..Default::default()
    }),
    |_| (
      resolver(Mark::new(), Mark::new(), true),
      visit_mut_pass(RefreshVisitor::new(
        Default::default(),
        "__file_hash__".into()
      ))
    ),
    should_handle_multiple_index,
    r#"
    import { createContext as cc } from '@lynx-js/react';
    import * as ns from '@lynx-js/react';
    import df from '@lynx-js/react';

    export function aaa(a, b) {
      cc({});
      ns.createContext();
      df.createContext(b);
      return function bbb(a, b, c) {
        cc({});
        ns.createContext();
        df.createContext(b);
      }
    }
    "#
  );

  test!(
    module,
    Syntax::Es(EsSyntax {
      jsx: true,
      ..Default::default()
    }),
    |_| (
      resolver(Mark::new(), Mark::new(), true),
      visit_mut_pass(RefreshVisitor::new(
        Default::default(),
        "__file_hash__".into()
      ))
    ),
    should_handle_function_parameter,
    r#"
    import { createContext } from '@lynx-js/react';

    export function aaa(a, b) {
      const context = createContext();
    }
    "#
  );

  test!(
    module,
    Syntax::Es(EsSyntax {
      jsx: true,
      ..Default::default()
    }),
    |_| (
      resolver(Mark::new(), Mark::new(), true),
      visit_mut_pass(RefreshVisitor::new(
        Default::default(),
        "__file_hash__".into()
      ))
    ),
    should_handle_init_value,
    r#"
    import { createContext } from '@lynx-js/react';

    export function aaa(a, b) {
      const context = createContext({
        key: "value"
      });
    }
    "#
  );
}
