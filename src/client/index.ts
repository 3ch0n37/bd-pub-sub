import amqp from "amqplib";
import {clientWelcome, commandStatus, getInput, printClientHelp, printQuit} from "../internal/gamelogic/gamelogic.js";
import {declareAndBind} from "../internal/pubsub/index.js";
import {ExchangePerilDirect, PauseKey} from "../internal/routing/routing.js";
import {GameState} from "../internal/gamelogic/gamestate.js";
import {commandSpawn} from "../internal/gamelogic/spawn.js";
import {commandMove} from "../internal/gamelogic/move.js";

async function main() {
    console.log("Starting Peril client...");
    const connection_string = "amqp://guest:guest@localhost:5672/";
    const connection = await amqp.connect(connection_string);
    console.log("Connected to RabbitMQ");
    const username = await clientWelcome();
    const [channel, queue] = await declareAndBind(connection, ExchangePerilDirect, `pause.${username}`, PauseKey, 'transient');

    const gameState = new GameState(username);

    while (true) {
        const words = await getInput("Peril> ");
        const command = words[0];

        if (command === "spawn") {
            commandSpawn(gameState, words);
        } else if (command === "move") {
            try {
                commandMove(gameState, words);
            } catch (err) {
                console.error("Move failed:", err);
            }
        } else if (command === "status") {
            await commandStatus(gameState);
        } else if (command === "help") {
            printClientHelp();
        } else if (command === "quit") {
            printQuit();
            await connection.close();
            process.exit(0);
        } else {
            console.log("Sorry, I don't understand that command.");
        }
    }
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
