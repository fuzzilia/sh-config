use std::borrow::BorrowMut;
use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};
use wasm_bindgen::prelude::*;

mod config;

pub struct ControllerState {
    count: i32,
}

static STATE_MAP: LazyLock<Mutex<HashMap<String, ControllerState>>> = LazyLock::new(|| Mutex::new(HashMap::new()));

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}!", name));
}

#[wasm_bindgen]
pub fn count(key: &str) -> i32 {
    let mut state = STATE_MAP.lock().unwrap();

    match state.get_mut(key) {
        Some(state) => {
            state.count += 1;
            state.count
        }
        None => {
            state.insert(key.to_string(), ControllerState { count: 0 });
            0
        }
    }
}
