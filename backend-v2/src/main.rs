use std::time::SystemTime;

use helpers::timestamp_to_integer;
use json::parse;
use store::{Store, StoreEntity};
use uuid::Uuid;

mod helpers;
mod store;

fn main() {
    let store = Store::new("data/test.pensive");

    println!("{}", timestamp_to_integer(SystemTime::now()));
    println!("{}", Uuid::new_v4().to_string());

    println!("{}", (parse("[123, 456, {}]").unwrap()).dump());

    store.write_entities(&[StoreEntity {
        timestamp: SystemTime::now(),
        entity: Uuid::new_v4(),
        key: "text".to_string(),
        value: parse("null").unwrap(),
    }]);
}
