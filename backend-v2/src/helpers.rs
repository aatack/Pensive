use std::time::{SystemTime, UNIX_EPOCH};

pub fn timestamp_to_integer(timestamp: SystemTime) -> i64 {
    i64::try_from(timestamp.duration_since(UNIX_EPOCH).unwrap().as_millis()).unwrap()
}
