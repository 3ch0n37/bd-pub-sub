import amqp from "amqplib";
import {clientWelcome} from "../internal/gamelogic/gamelogic.js";
import {declareAndBind} from "../internal/pubsub/index.js";
import {ExchangePerilDirect, PauseKey} from "../internal/routing/routing.js";

async function main() {
    console.log("Starting Peril client...");
    const connection_string = "amqp://guest:guest@localhost:5672/";
    const connection = await amqp.connect(connection_string);
    console.log("Connected to RabbitMQ");
    const username = await clientWelcome();
    const [channel, queue] = await declareAndBind(connection, ExchangePerilDirect, `pause.${username}`, PauseKey, 'transient');

}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
