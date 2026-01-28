(() => {
  const POLL_MS = 3000;
  const MAX_HISTORY = 60;
  const grid = document.getElementById("clients-grid");
  if (!grid) {
    return;
  }

  const charts = new Map();
  const histories = new Map();
  let timerId = null;

  const normalizeClients = (payload) => {
    if (!payload) {
      return [];
    }
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload.clients)) {
      return payload.clients;
    }
    return [];
  };

  const getId = (client, index) => {
    return client.id || client.mac || client.macAddress || client.name || `client-${index}`;
  };

  const getName = (client, id) => {
    return client.name || client.hostname || client.device || id;
  };

  const getSignal = (client) => {
    const raw = client.signal ?? client.rssi ?? client.signalDbm;
    if (raw === undefined || raw === null || Number.isNaN(Number(raw))) {
      return null;
    }
    return Number(raw);
  };

  const signalColor = (signal) => {
    if (signal === null) {
      return "signal-unknown";
    }
    if (signal >= -50) {
      return "signal-strong";
    }
    if (signal >= -65) {
      return "signal-good";
    }
    if (signal >= -80) {
      return "signal-weak";
    }
    return "signal-poor";
  };

  const formatSignal = (signal) => {
    return signal === null ? "—" : `${signal} dBm`;
  };

  const ensureHistory = (id) => {
    if (!histories.has(id)) {
      histories.set(id, []);
    }
    return histories.get(id);
  };

  const renderHistory = (canvas, history) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = canvas.width || canvas.clientWidth || 240;
    const height = canvas.height || canvas.clientHeight || 60;
    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    if (!history.length) {
      return;
    }

    const minSignal = -90;
    const maxSignal = -30;
    const clamp = (value) => Math.max(minSignal, Math.min(maxSignal, value));
    const points = history.map((value) => clamp(value));

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#2b6cb0";
    ctx.beginPath();

    points.forEach((value, index) => {
      const x = (index / Math.max(1, points.length - 1)) * (width - 4) + 2;
      const ratio = (value - minSignal) / (maxSignal - minSignal);
      const y = height - 2 - ratio * (height - 4);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  const createCard = (id, name) => {
    const card = document.createElement("article");
    card.className = "client-card";
    card.dataset.clientId = id;

    const header = document.createElement("div");
    header.className = "client-header";

    const title = document.createElement("h3");
    title.className = "client-name";
    title.textContent = name;

    const signal = document.createElement("span");
    signal.className = "client-signal";
    signal.textContent = "—";

    header.appendChild(title);
    header.appendChild(signal);

    const meta = document.createElement("div");
    meta.className = "client-meta";

    const idLine = document.createElement("span");
    idLine.className = "client-id";
    idLine.textContent = id;
    meta.appendChild(idLine);

    const canvas = document.createElement("canvas");
    canvas.className = "signal-chart";
    canvas.width = 240;
    canvas.height = 60;

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(canvas);

    grid.appendChild(card);

    charts.set(id, { card, signal, canvas, title });
    return charts.get(id);
  };

  const updateCard = (client, index) => {
    const id = getId(client, index);
    const name = getName(client, id);
    const signalValue = getSignal(client);

    const entry = charts.get(id) || createCard(id, name);
    entry.title.textContent = name;
    entry.signal.textContent = formatSignal(signalValue);

    const history = ensureHistory(id);
    if (signalValue !== null) {
      history.push(signalValue);
      if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
      }
    }

    entry.card.classList.remove("signal-strong", "signal-good", "signal-weak", "signal-poor", "signal-unknown");
    entry.card.classList.add(signalColor(signalValue));
    renderHistory(entry.canvas, history);
  };

  const reconcileCards = (clients) => {
    const seen = new Set();
    clients.forEach((client, index) => {
      const id = getId(client, index);
      seen.add(id);
      updateCard(client, index);
    });

    Array.from(charts.keys()).forEach((id) => {
      if (!seen.has(id)) {
        const entry = charts.get(id);
        if (entry) {
          entry.card.remove();
        }
        charts.delete(id);
        histories.delete(id);
      }
    });
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/wifi-clients", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      const clients = normalizeClients(payload);
      reconcileCards(clients);
    } catch (error) {
      return;
    }
  };

  const startPolling = () => {
    fetchClients();
    timerId = window.setInterval(fetchClients, POLL_MS);
  };

  const stopPolling = () => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopPolling();
    } else {
      startPolling();
    }
  });

  startPolling();
})();
