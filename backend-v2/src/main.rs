use std::time::SystemTime;

use json::parse;
use std::fs;
use store::{Store, StoreEntity, StoreResource};
use uuid::Uuid;

mod helpers;
mod store;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let store = Store::new("data/test.pensive");

    let id = Uuid::new_v4();

    let _ = store.write_resources(&[StoreResource {
        timestamp: SystemTime::now(),
        resource: id,
        data: fs::read("data/test_file.txt")?,
    }]);

    println!("{}", fs::read("data/test_file.txt").unwrap().len());
    Ok(())
}
