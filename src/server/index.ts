import amqp from "amqplib";
import {PauseKey, ExchangePerilDirect, ExchangePerilTopic, GameLogSlug} from "../internal/routing/routing.js";
import {declareAndBind, publishJson} from "../internal/pubsub/index.js";
import {getInput, printServerHelp} from "../internal/gamelogic/gamelogic.js";

async function main() {
    console.log("Starting Peril server...");
    const connection_string = "amqp://guest:guest@localhost:5672/";
    const connection = await amqp.connect(connection_string);
    console.log("Connected to RabbitMQ");
    const confirmChannel = await connection.createConfirmChannel();
    await declareAndBind(connection, ExchangePerilTopic, GameLogSlug, GameLogSlug + '.*', 'durable');

    process.on("SIGINT", async () => {
        try {
            console.log("Closing RabbitMQ connection...")
            await connection.close();
        } catch (err) {
            console.error("Error closing RabbitMQ connection:", err);
        } finally {
            process.exit(0);
        }
    })

    printServerHelp();
    while (true) {
        const words = await getInput("Peril> ");
        if (words.length === 0) {
            continue;
        }
        const command = words[0];
        const args = words.slice(1);
        if (command === "pause") {
            await publishJson(confirmChannel, ExchangePerilDirect, PauseKey, {
                isPaused: true,
            });
            console.log("Game paused");
        } else if (command === "resume") {
            await publishJson(confirmChannel, ExchangePerilDirect, PauseKey, {
                isPaused: false,
            });
            console.log("Game resumed");
        } else if (command === "quit") {
            console.log("Closing Peril server...");
            await connection.close();
            process.exit(0);
        } else if (command === "help") {
            printServerHelp();
        } else {
            console.log("Sorry, I don't understand that command.");
        }
    }
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
