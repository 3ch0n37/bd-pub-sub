import amqp, {type ConfirmChannel, type Channel} from "amqplib";

export type SimpleQueueType = 'durable' | 'transient';

export async function publishJson<T>(ch: ConfirmChannel, exchange: string, routingKey: string, value: T): Promise<void> {
    const payload = JSON.stringify(value);
    const success =  ch.publish(exchange, routingKey, Buffer.from(payload), { contentType: "application/json"});
    if (!success) {
        throw new Error("Failed to publish message");
    }
}

export async function declareAndBind(
    conn: amqp.ChannelModel,
    exchange: string,
    queueName: string,
    key: string,
    queue_type: SimpleQueueType
): Promise<[Channel, amqp.Replies.AssertQueue]> {
    const channel = await conn.createChannel();
    let queue
    if (queue_type === "durable") {
        queue = await channel.assertQueue(queueName, {
            durable: true,
        });
    } else {
        queue = await channel.assertQueue(queueName, {
            autoDelete: true,
            exclusive: true,
        })
    }
    await channel.bindQueue(queueName, exchange, key);
    return [channel, queue];
}