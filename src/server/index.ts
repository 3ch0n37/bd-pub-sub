import amqp from "amqplib";

async function main() {
  console.log("Starting Peril server...");
  const connection_string = "amqp://guest:guest@localhost:5672/";
  const connection = await amqp.connect(connection_string);
  console.log("Connected to RabbitMQ");
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
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
