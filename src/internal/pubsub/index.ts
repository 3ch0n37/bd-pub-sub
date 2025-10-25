import amqp, {type ConfirmChannel, type Channel} from "amqplib";

export type SimpleQueueType = 'durable' | 'transient';

export async function publishJson<T>(ch: ConfirmChannel, exchange: string, routingKey: string, value: T): Promise<void> {
    const payload = JSON.stringify(value);
    const success =  ch.publish(exchange, routingKey, Buffer.from(payload), { contentType: "application/json"});
    if (!success) {
        throw new Error("Failed to publish message");
    }
}

export async function subscribeJSON<T>(
    conn: amqp.ChannelModel,
    exchange: string,
    queueName: string,
    key: string,
    queueType: SimpleQueueType,
    handler: (data: T) => void,
): Promise<void> {
    const [ch, queue] = await declareAndBind(
        conn,
        exchange,
        queueName,
        key,
        queueType,
    );

    await ch.consume(queue.queue, function (msg: amqp.ConsumeMessage | null) {
        if (!msg) return;

        let data: T;
        try {
            data = JSON.parse(msg.content.toString());
        } catch (err) {
            console.error("Could not unmarshal message:", err);
            return;
        }

        handler(data);
        ch.ack(msg);
    });
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