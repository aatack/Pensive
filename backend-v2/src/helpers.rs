use std::time::{Duration, SystemTime, UNIX_EPOCH};

pub fn timestamp_to_integer(timestamp: SystemTime) -> i64 {
    i64::try_from(timestamp.duration_since(UNIX_EPOCH).unwrap().as_millis()).unwrap()
}

pub fn integer_to_timestamp(integer: i64) -> SystemTime {
    UNIX_EPOCH + Duration::from_millis(u64::try_from(integer).unwrap())
}
