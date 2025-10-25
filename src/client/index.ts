import amqp from "amqplib";
import {clientWelcome, commandStatus, getInput, printClientHelp, printQuit} from "../internal/gamelogic/gamelogic.js";
import {publishJson, subscribeJSON} from "../internal/pubsub/index.js";
import {ArmyMovesPrefix, ExchangePerilDirect, ExchangePerilTopic, PauseKey} from "../internal/routing/routing.js";
import {GameState} from "../internal/gamelogic/gamestate.js";
import {commandSpawn} from "../internal/gamelogic/spawn.js";
import {commandMove} from "../internal/gamelogic/move.js";
import {handlerMove, handlerPause} from "./handlers.js";

async function main() {
    console.log("Starting Peril client...");
    const connection_string = "amqp://guest:guest@localhost:5672/";
    const connection = await amqp.connect(connection_string);
    console.log("Connected to RabbitMQ");
    const username = await clientWelcome();
    const confirmChannel = await connection.createConfirmChannel();

    const gameState = new GameState(username);

    await subscribeJSON(
        connection,
        ExchangePerilDirect,
        `${PauseKey}.${username}`,
        PauseKey,
        'transient',
        handlerPause(gameState),
    );

    await subscribeJSON(
        connection,
        ExchangePerilTopic,
        `${ArmyMovesPrefix}.${username}`,
        `${ArmyMovesPrefix}.*`,
        'transient',
        handlerMove(gameState),
    )

    while (true) {
        const words = await getInput("Peril> ");
        const command = words[0];

        if (command === "spawn") {
            commandSpawn(gameState, words);
        } else if (command === "move") {
            try {
                const move = commandMove(gameState, words);

                await publishJson(confirmChannel, ExchangePerilTopic, `${ArmyMovesPrefix}.${username}`, move)
            } catch (err: unknown) {
                if (err instanceof Error) {
                    console.error("Move failed:", err.message);
                }
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
