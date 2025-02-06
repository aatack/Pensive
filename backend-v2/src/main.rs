use std::time::SystemTime;

use helpers::timestamp_to_integer;
use json::parse;
use store::{Store, StoreEntity};
use uuid::Uuid;

mod helpers;
mod store;

fn main() {
    let store = Store::new("data/test.pensive");

    let id = Uuid::new_v4();

    store.write_entities(&[StoreEntity {
        timestamp: SystemTime::now(),
        entity: id,
        key: "text".to_string(),
        value: parse("null").unwrap(),
    }]);

    let results = store.read_entities(&[id.to_string()]).unwrap();
    for entity in results {
        println!("{:?}", entity);
    }
}
