export async function withLoading(fn: () => Promise<void>, isLoading: boolean, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>) {
    if (isLoading) return;

    setIsLoading(true);
    try {
        await fn();
    } finally {
        setIsLoading(false);
    }
}