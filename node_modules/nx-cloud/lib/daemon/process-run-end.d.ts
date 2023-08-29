export default function processRunEnd(data: any, logger: {
    log: (str: string) => void;
}): Promise<string>;
