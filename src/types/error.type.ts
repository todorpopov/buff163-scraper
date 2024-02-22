export type Error = {
    total_errors: number,
    property_undefined_errors: number,
    request_errors: number,
    tmr_errors: number // TMR is shor for Too Many Requests - Status Code "429"
}