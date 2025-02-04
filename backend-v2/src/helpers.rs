use std::time::{SystemTime, UNIX_EPOCH};

pub fn timestamp_to_integer(timestamp: SystemTime) -> u128 {
    timestamp.duration_since(UNIX_EPOCH).unwrap().as_millis()
}
