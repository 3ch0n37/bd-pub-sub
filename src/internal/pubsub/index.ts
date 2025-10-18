import type {ConfirmChannel} from "amqplib";

export async function publishJson<T>(ch: ConfirmChannel, exchange: string, routingKey: string, value: T): Promise<void> {
    const payload = JSON.stringify(value);
    const success =  ch.publish(exchange, routingKey, Buffer.from(payload), { contentType: "application/json"});
    if (!success) {
        throw new Error("Failed to publish message");
    }
}