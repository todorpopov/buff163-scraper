export async function sleepMs(ms: number): Promise<void>{
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

export function getDate(){
    return new Date().toLocaleString('en-GB', {
        hour12: false,
    })
}