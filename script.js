const tokens = [
  {
    symbol: "NVDAx",
    name: "Nvidia",
    chain: 172.88,
    reference: 168.1,
    gap: 2.84,
    spread: 0.92,
    depth: 1.8,
    signal: "Limit only",
    risk: "high",
    route: "Limit order only",
    note: "NVDAx is trading above reference with a widening spread. Limit orders only until liquidity normalizes.",
    rights: {
      Dividends: "Issuer pass-through",
      Voting: "No",
      Backing: "Broker-custodied exposure",
      Issuer: "Robinhood EU",
      Redemption: "Issuer terms",
    },
  },
  {
    symbol: "AAPLx",
    name: "Apple",
    chain: 214.72,
    reference: 213.98,
    gap: 0.35,
    spread: 0.18,
    depth: 4.6,
    signal: "Clear",
    risk: "low",
    route: "Market or limit",
    note: "AAPLx is tracking reference closely. Spread is inside the watch threshold.",
    rights: {
      Dividends: "Eligible",
      Voting: "No",
      Backing: "Custodied share exposure",
      Issuer: "Robinhood EU",
      Redemption: "Restricted",
    },
  },
  {
    symbol: "TSLAx",
    name: "Tesla",
    chain: 319.42,
    reference: 323.24,
    gap: -1.18,
    spread: 0.76,
    depth: 0.9,
    signal: "Watch depth",
    risk: "medium",
    route: "Split order",
    note: "TSLAx is below reference while book depth is shallow. Liquidity status is marked watch.",
    rights: {
      Dividends: "None expected",
      Voting: "No",
      Backing: "Synthetic exposure review",
      Issuer: "Robinhood EU",
      Redemption: "Limited",
    },
  },
  {
    symbol: "HOODx",
    name: "Robinhood",
    chain: 98.16,
    reference: 97.62,
    gap: 0.55,
    spread: 0.22,
    depth: 3.2,
    signal: "Normal",
    risk: "low",
    route: "Market or limit",
    note: "HOODx remains near reference with normal liquidity for the current session.",
    rights: {
      Dividends: "N/A",
      Voting: "No",
      Backing: "Listed equity exposure",
      Issuer: "Robinhood EU",
      Redemption: "Issuer terms",
    },
  },
  {
    symbol: "MSFTx",
    name: "Microsoft",
    chain: 505.38,
    reference: 503.91,
    gap: 0.29,
    spread: 0.2,
    depth: 5.1,
    signal: "Clear",
    risk: "low",
    route: "Market or limit",
    note: "MSFTx has strong depth and a tight spread in this simulated session.",
    rights: {
      Dividends: "Eligible",
      Voting: "No",
      Backing: "Custodied share exposure",
      Issuer: "Robinhood EU",
      Redemption: "Issuer terms",
    },
  },
];

const basketSets = {
  semis: [
    ["NVDAx", 34],
    ["AVGOx", 22],
    ["TSMx", 18],
    ["AMDx", 14],
    ["QCOMx", 12],
  ],
  dividend: [
    ["AAPLx", 28],
    ["MSFTx", 25],
    ["AVGOx", 22],
    ["QCOMx", 15],
    ["COSTx", 10],
  ],
  hood: [
    ["HOODx", 36],
    ["COINx", 24],
    ["SOFIx", 18],
    ["SQx", 14],
    ["PYPLx", 8],
  ],
};

const STORAGE_KEY = "equityos.mvp.v3";

const state = {
  selected: tokens[0],
  filter: "all",
  wallet: null,
  positions: JSON.parse(localStorage.getItem(`${STORAGE_KEY}.positions`) || "{}"),
  watchlist: JSON.parse(localStorage.getItem(`${STORAGE_KEY}.watchlist`) || "[]"),
  alerts: JSON.parse(localStorage.getItem(`${STORAGE_KEY}.alerts`) || "[]"),
  activity: [
    ["Market", "Robinhood Chain tokenized equity monitor initialized."],
    ["Rights", "AAPLx dividend handling marked eligible in issuer terms."],
    ["Liquidity", "TSLAx spread moved above 0.75%. Slippage watch enabled."],
  ],
};

const $ = (selector) => document.querySelector(selector);
const pageCopy = {
  dashboard: {
    kicker: "Tokenized equity utility dapp",
    title: "Track, verify, and organize on-chain stocks.",
  },
  markets: {
    kicker: "Markets",
    title: "Browse tokenized equities and select an asset.",
  },
  rights: {
    kicker: "Rights checker",
    title: "Verify issuer terms before you act.",
  },
  liquidity: {
    kicker: "Liquidity board",
    title: "Check spread, depth, and route quality.",
  },
  baskets: {
    kicker: "Basket builder",
    title: "Create local baskets for tokenized equity themes.",
  },
  alerts: {
    kicker: "Alert center",
    title: "Save local rules for market changes.",
  },
};

const tokenRows = $("#tokenRows");
const tokenRowsPage = $("#tokenRowsPage");
const feedList = $("#feedList");
const feedListAlerts = $("#feedListAlerts");
const rightsList = $("#rightsList");
const basketList = $("#basketList");
const alertList = $("#alertList");
const searchInput = $("#searchInput");

function money(value) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function gapText(value) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function saveLocal() {
  localStorage.setItem(`${STORAGE_KEY}.positions`, JSON.stringify(state.positions));
  localStorage.setItem(`${STORAGE_KEY}.watchlist`, JSON.stringify(state.watchlist));
  localStorage.setItem(`${STORAGE_KEY}.alerts`, JSON.stringify(state.alerts));
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function addActivity(type, copy) {
  state.activity.unshift([type, copy]);
  state.activity = state.activity.slice(0, 8);
  renderActivity();
}

function filteredTokens() {
  const search = searchInput.value.trim().toLowerCase();
  return tokens.filter((token) => {
    const matchesSearch = !search || token.symbol.toLowerCase().includes(search) || token.name.toLowerCase().includes(search);
    const matchesFilter =
      state.filter === "all" ||
      (state.filter === "gap" && Math.abs(token.gap) > 0.5) ||
      (state.filter === "risk" && token.risk !== "low") ||
      (state.filter === "held" && state.positions[token.symbol]);
    return matchesSearch && matchesFilter;
  });
}

function renderRows() {
  const rows = filteredTokens();
  const markup = rows
    .map((token) => {
      const signalClass = token.risk === "high" ? "high" : token.risk === "medium" ? "watch" : "clear";
      const held = state.positions[token.symbol] ? `<small>${state.positions[token.symbol]} held</small>` : "";
      return `
        <tr class="${token.symbol === state.selected.symbol ? "selected" : ""}" data-symbol="${token.symbol}">
          <td><span class="token-cell"><span class="ticker-dot">${token.symbol.slice(0, 2)}</span><span>${token.symbol}<small>${token.name}</small></span></span></td>
          <td>${money(token.chain)} ${held}</td>
          <td>${money(token.reference)}</td>
          <td class="${token.gap >= 0 ? "up" : "down"}">${gapText(token.gap)}</td>
          <td>${token.spread.toFixed(2)}%</td>
          <td>$${token.depth.toFixed(1)}M</td>
          <td><span class="signal ${signalClass}">${token.signal}</span></td>
        </tr>
      `;
    })
    .join("");

  [tokenRows, tokenRowsPage].forEach((tableBody) => {
    tableBody.innerHTML = markup;
    tableBody.querySelectorAll("tr").forEach((row) => {
      row.addEventListener("click", () => {
        state.selected = tokens.find((token) => token.symbol === row.dataset.symbol);
        render();
      });
    });
  });
}

function renderSelected() {
  const token = state.selected;
  $("#selectedSymbol").textContent = token.symbol;
  $("#selectedName").textContent = `${token.name} tokenized equity`;
  $("#selectedChain").textContent = money(token.chain);
  $("#selectedGap").textContent = `${gapText(token.gap)} vs reference`;
  $("#selectedNote").textContent = token.note;
  $("#severityTag").textContent = token.risk === "high" ? "High" : token.risk === "medium" ? "Medium" : "Low";
  $("#severityTag").className = `severity ${token.risk === "high" ? "high" : token.risk === "medium" ? "medium" : "low"}`;
  $("#spreadBar").style.width = `${Math.min(100, token.spread * 90)}%`;
  $("#depthBar").style.width = `${Math.max(12, Math.min(100, token.depth * 18))}%`;
  $("#spreadValue").textContent = `${token.spread.toFixed(2)}%`;
  $("#depthValue").textContent = `$${token.depth.toFixed(1)}M`;
  $("#routeValue").textContent = token.route;
  $("#watchBtn").textContent = state.watchlist.includes(token.symbol) ? "Watching" : "Add watch";
  $("#rightsContextSymbol").textContent = token.symbol;
  $("#rightsContextNote").textContent = token.note;
  $("#liquidityContextNote").textContent = token.note;
}

function renderRights() {
  rightsList.innerHTML = Object.entries(state.selected.rights)
    .map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`)
    .join("");
}

function renderBasket(kind = "semis") {
  const data = basketSets[kind] || basketSets.semis;
  basketList.innerHTML = data
    .map(
      ([symbol, weight]) => `
        <div class="basket-row">
          <strong>${symbol}</strong>
          <div class="weight-track"><span style="width:${weight}%"></span></div>
          <span>${weight}%</span>
        </div>
      `,
    )
    .join("");
}

function renderActivity() {
  const markup = state.activity
    .map(
      ([type, copy], index) => `
        <article class="feed-item ${index === 0 ? "active" : ""}">
          <div class="feed-meta"><span>${type}</span><span>${index + 1}m ago</span></div>
          <p>${copy}</p>
        </article>
      `,
    )
    .join("");
  feedList.innerHTML = markup;
  feedListAlerts.innerHTML = markup;
}

function renderAlerts() {
  $("#alertCount").textContent = state.alerts.length;
  alertList.innerHTML =
    state.alerts.length === 0
      ? `<article class="feed-item"><p>No alerts yet. Create one for ${state.selected.symbol}.</p></article>`
      : state.alerts
          .map(
            (alert) => `
              <article class="feed-item">
                <div class="feed-meta"><span>${alert.symbol}</span><span>${alert.rule}</span></div>
                <p>${alert.copy}</p>
              </article>
            `,
          )
          .join("");
}

function renderMetrics() {
  const value = Object.entries(state.positions).reduce((sum, [symbol, amount]) => {
    const token = tokens.find((item) => item.symbol === symbol);
    return token ? sum + token.chain * amount : sum;
  }, 0);
  const heldRisks = Object.entries(state.positions).map(([symbol]) => tokens.find((token) => token.symbol === symbol)?.risk).filter(Boolean);
  const risky = heldRisks.filter((risk) => risk !== "low").length;
  $("#portfolioValue").textContent = money(value);
  $("#portfolioDelta").textContent = value > 0 ? "Demo holdings marked locally" : "No demo positions yet";
  $("#watchCount").textContent = state.watchlist.length;
  $("#riskScore").textContent = heldRisks.length ? `${Math.max(12, 100 - risky * 24)}/100` : "--";
}

function renderWallet() {
  if (!state.wallet) return;
  $("#walletStatus").textContent = state.wallet.demo ? "Demo wallet connected" : "Wallet connected";
  $("#walletAddress").textContent = shortAddress(state.wallet.address);
  $("#connectWalletBtn").textContent = "Connected";
  $("#connectWalletBtn").disabled = true;
  $("#walletBox").classList.add("connected");
}

function render() {
  renderRows();
  renderSelected();
  renderRights();
  renderActivity();
  renderAlerts();
  renderMetrics();
  renderWallet();
}

async function connectWallet() {
  if (window.ethereum?.request) {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      state.wallet = { address: accounts[0], demo: false };
      addActivity("Wallet", `Connected ${shortAddress(accounts[0])}.`);
      render();
      return;
    } catch (error) {
      addActivity("Wallet", "Wallet connection rejected. Demo mode is still available.");
    }
  }

  state.wallet = { address: "0xE05f15A00000000000000000000000000000dApp", demo: true };
  addActivity("Wallet", "Demo wallet connected. Actions will create local receipts.");
  render();
}

function buySelected() {
  if (!state.wallet) {
    connectWallet();
    return;
  }
  const amount = Math.max(1, Number($("#tradeAmount").value || 1));
  const token = state.selected;
  state.positions[token.symbol] = Number(((state.positions[token.symbol] || 0) + amount).toFixed(4));
  saveLocal();
  addActivity("Receipt", `Bought ${amount} ${token.symbol} at ${money(token.chain)} in demo mode.`);
  render();
}

function toggleWatch() {
  const symbol = state.selected.symbol;
  if (state.watchlist.includes(symbol)) {
    state.watchlist = state.watchlist.filter((item) => item !== symbol);
    addActivity("Watchlist", `${symbol} removed from watchlist.`);
  } else {
    state.watchlist.push(symbol);
    addActivity("Watchlist", `${symbol} added to watchlist.`);
  }
  saveLocal();
  render();
}

function createAlert(event) {
  event.preventDefault();
  const rule = $("#alertRule").value;
  const labels = {
    gap: "Gap above 2%",
    spread: "Spread above 0.75%",
    rights: "Rights update",
  };
  const alert = {
    symbol: state.selected.symbol,
    rule: labels[rule],
    copy: `${labels[rule]} alert created for ${state.selected.symbol}.`,
  };
  state.alerts.unshift(alert);
  saveLocal();
  addActivity("Alert", alert.copy);
  render();
}

function verifyRights() {
  addActivity("Rights", `${state.selected.symbol} issuer terms verified locally for MVP preview.`);
}

function routePage() {
  const requested = window.location.hash.replace("#", "") || "dashboard";
  const page = pageCopy[requested] ? requested : "dashboard";
  const copy = pageCopy[page];
  $("#pageKicker").textContent = copy.kicker;
  $("#pageTitle").textContent = copy.title;

  document.querySelectorAll("[data-page]").forEach((section) => {
    section.hidden = section.dataset.page !== page;
  });

  document.querySelectorAll("[data-page-link]").forEach((link) => {
    link.classList.toggle("active", link.dataset.pageLink === page);
  });

  if (requested !== page) {
    window.location.hash = page;
  }
}

$("#connectWalletBtn").addEventListener("click", connectWallet);
$("#buyBtn").addEventListener("click", buySelected);
$("#watchBtn").addEventListener("click", toggleWatch);
$("#verifyRightsBtn").addEventListener("click", verifyRights);
$("#alertForm").addEventListener("submit", createAlert);
window.addEventListener("hashchange", routePage);

document.querySelectorAll(".segmented button").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll(".segmented button").forEach((item) => item.classList.toggle("active", item === button));
    renderRows();
  });
});

$("#basketForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const preset = $("#basketPreset").value;
  renderBasket(preset);
  addActivity("Basket", `${$("#basketPreset").selectedOptions[0].textContent} generated locally.`);
});

$("#refreshBtn").addEventListener("click", () => {
  tokens.forEach((token) => {
    const move = (Math.random() - 0.48) * 0.26;
    token.chain = Number((token.chain * (1 + move / 100)).toFixed(2));
    token.gap = Number((((token.chain - token.reference) / token.reference) * 100).toFixed(2));
  });
  addActivity("Market", "Market data refreshed with simulated Robinhood Chain ticks.");
  render();
});

searchInput.addEventListener("input", renderRows);

render();
renderBasket();
routePage();
