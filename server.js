
const http = require("http");
const path = require("path");
const fs = require("fs");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

const LOG_DIR = path.join(__dirname, "logs");
const LOG_FILE = path.join(LOG_DIR, "server.log");

function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Failed to create log directory:", err);
  }
}

function log(message, meta) {
  ensureLogDir();

  const timestamp = new Date().toISOString();
  const line =
    `[${timestamp}] ${message}` +
    (meta ? ` | ${JSON.stringify(meta, null, 2)}` : "") +
    "\n";

  try {
    process.stdout.write(line);
  } catch {
    // ignore
  }

  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) {
      try {
        process.stderr.write(
          `[${timestamp}] Failed to write to log file: ${err.message}\n`
        );
      } catch {
        // ignore
      }
    }
  });
}

process.on("uncaughtException", (err) => {
  log("UNCAUGHT_EXCEPTION", {
    message: err.message,
    stack: err.stack,
  });
});

process.on("unhandledRejection", (reason, promise) => {
  log("UNHANDLED_REJECTION", {
    reason:
      reason instanceof Error
        ? { message: reason.message, stack: reason.stack }
        : reason,
  });
});

function setupShutdownLogging(server) {
  const shutdown = (signal) => {
    log(`RECEIVED_${signal}_SIGNAL_STARTING_SHUTDOWN`);

    server.close((err) => {
      if (err) {
        log("SERVER_CLOSE_ERROR", { error: err.message, stack: err.stack });
        process.exit(1);
      } else {
        log("SERVER_CLOSED_CLEANLY");
        process.exit(0);
      }
    });

    setTimeout(() => {
      log("FORCED_PROCESS_EXIT_AFTER_TIMEOUT");
      process.exit(1);
    }, 30_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

setInterval(() => {
  try {
    const mem = process.memoryUsage();
    log("MEMORY_USAGE", {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
    });
  } catch {
    // ignore
  }
}, 10 * 60 * 1000).unref();

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      handle(req, res);
    });

    server.listen(port, (err) => {
      if (err) {
        log("SERVER_START_ERROR", { error: err.message, stack: err.stack });
        throw err;
      }

      log("SERVER_STARTED", {
        port,
        env: process.env.NODE_ENV,
        pid: process.pid,
      });
    });

    setupShutdownLogging(server);
  })
  .catch((err) => {
    log("APP_PREPARE_ERROR", { error: err.message, stack: err.stack });
    process.exit(1);
  });

