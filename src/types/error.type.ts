export type Error = {
    total_errors: number,
    property_undefined_errors: number,
    request_errors: number,
    too_many_reqests: number // TMR is shor for Too Many Requests - Status Code "429"
}