import { Error } from "./error.type"
import { Options } from "./options.type"

export type ServerStatistics = {
    date: string,
    number_of_items: number,
    pages_scraped: number,
    average_scrape_time_ms: string,
    errors: Error,
    free_memory: number,
    free_memory_percentage: number,
    total_memory: number,
    options: Options
}