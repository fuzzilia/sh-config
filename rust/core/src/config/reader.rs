
pub struct ConfigReader {

}

impl ConfigReader {
    pub fn new() -> ConfigReader {
        ConfigReader {}
    }
}

struct Layer {

}

struct Button {
    value: u16,
}

impl Button {
    pub fn new(value: u16) -> Button {
        Button {value}
    }
    
    pub fn get_type() -> ButtonType {
        ButtonType::from_u8().unwrap()
    }
}

#[repr(u8)]
enum ButtonType {
    Empty = 0,
    Standard = 1,
    Gesture = 2,
    Rotation = 3,
}

impl ButtonType {
    pub fn from_u8(value: u8) -> Result<ButtonType, ErrorType> {
        match value {
            0 => Ok(ButtonType::Empty),
            1 => Ok(ButtonType::Standard),
            2 => Ok(ButtonType::Gesture),
            3 => Ok(ButtonType::Rotation),
            _ => Err(ErrorType::InvalidButtonType),
        }
    }
}

#[repr(u16)]
enum ErrorType {
    Uninitialized = 1,
    UnknownVersion,
    UnknownKeypadId,
    InvalidButtonBlock,
    InvalidButtonType,
}

struct ConfigError {
    error_type: ErrorType,
    value: u16,
}