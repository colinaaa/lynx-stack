use wasm_bindgen::prelude::*;

pub mod transformer;

/// lifted from the `console_log` example
/// Accepts a raw uint16 pointer from JS and transforms the inline style string into a JS string.
/// Returns `Some(JsString)` if the transformation was successful, or `None` if the input was empty or invalid.
///
/// # Safety
/// The caller must ensure that `ptr` is valid and points to a slice of `u16` of length `len`.
/// This is a contract with the JavaScript side. Passing an invalid pointer or incorrect length may cause undefined behavior.
#[wasm_bindgen]
pub unsafe fn transform_raw_u16_inline_style_ptr(
  ptr: *const u16,
  len: usize,
) -> Option<js_sys::JsString> {
  // Safety: We assume the pointer is valid and points to a slice of u16
  // of length `len`. This is a contract with the JavaScript side.
  unsafe {
    let slice = core::slice::from_raw_parts(ptr, len);
    // Call the tokenize function with our data and callback
    let (transformed_inline_style, _) =
      transformer::transform::transform_inline_style_string(slice);
    if !transformed_inline_style.is_empty() {
      return Some(js_sys::JsString::from_char_code(
        transformed_inline_style.as_slice(),
      ));
    }
  }
  None
}
macro_rules! push_parsed_result_to_js_array {
  ($source:expr) => {{
    let target = js_sys::Array::new();
    for transformed in $source {
      let (name_source, name_start, name_end, value_source, value_start, value_end) = transformed;
      let k = js_sys::JsString::from_char_code(name_source.get(name_start..name_end).unwrap());
      let v = js_sys::JsString::from_char_code(value_source.get(value_start..value_end).unwrap());
      let pair = js_sys::Array::new();
      pair.push(&k);
      pair.push(&v);
      target.push(&pair);
    }
    target
  }};
}

/// Accepts raw uint16 pointers from JS and parses the inline style name and value into a JS array.
/// Returns `Some(Array)` if parsing was successful, or `None` if both results are empty.
///
/// # Safety
/// The caller must ensure that `name_ptr` and `value_ptr` are valid and point to slices of `u16` of lengths `name_len` and `value_len` respectively.
/// Passing invalid pointers or incorrect lengths may cause undefined behavior.
#[wasm_bindgen]
pub unsafe fn transform_raw_u16_inline_style_ptr_parsed(
  name_ptr: *const u16,
  name_len: usize,
  value_ptr: *const u16,
  value_len: usize,
) -> Option<js_sys::Array> {
  unsafe {
    let name_slice = core::slice::from_raw_parts(name_ptr, name_len);
    let value_slice = core::slice::from_raw_parts(value_ptr, value_len);
    // Call the tokenize function with our data and callback
    let (result, children_result) = transformer::transform::query_transform_rules(
      name_slice,
      0,
      name_len,
      value_slice,
      0,
      value_len,
    );
    if result.is_empty() && children_result.is_empty() {
      // if there are no results, we return None
      return None;
    }
    // now we need to convert the result into a JS array
    let ret = js_sys::Array::new();
    ret.push(&push_parsed_result_to_js_array!(result).into());
    if !children_result.is_empty() {
      // if there are no children, we don't need to push an empty array
      // but if there are children, we need to push them as well
      ret.push(&push_parsed_result_to_js_array!(children_result).into());
    }
    Some(ret)
  }
}

#[wasm_bindgen]
pub fn malloc(size: usize) -> *mut u8 {
  // Allocate memory on the heap
  let layout = std::alloc::Layout::from_size_align(size, 16).unwrap();
  unsafe { std::alloc::alloc(layout) }
}

/// Frees the allocated memory at the given pointer with the specified size.
///
/// # Safety
/// The caller must ensure that `ptr` was allocated with the same size and alignment using `malloc`,
/// and that it is not used after being freed. Passing an invalid pointer or incorrect size may cause undefined behavior.
#[wasm_bindgen]
pub unsafe fn free(ptr: *mut u8, size: usize) {
  // Free the allocated memory
  // We need to reconstruct the Layout that was used for allocation.
  // Assuming align is 1 as used in malloc.
  let layout = std::alloc::Layout::from_size_align(size, 16).unwrap();
  unsafe { std::alloc::dealloc(ptr, layout) }
}
