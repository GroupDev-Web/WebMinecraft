(function () {
	"use strict";

	var SERVERS_KEY = "lowframe.servers";
	var VERSION_KEY = "lowframe.version";

	var VERSIONS = {
		"1.12": { label: "1.12.2", assetsURI: "engine/1.12/assets.epw", bootstrap: "engine/1.12/bootstrap.js" },
		"1.8": { label: "1.8.9", assetsURI: "engine/1.8/assets.epw", bootstrap: "engine/1.8/bootstrap.js" }
	};

	// ---------- helpers ----------

	function $(sel) { return document.querySelector(sel); }
	function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

	function toast(msg) {
		var el = $("#toast");
		el.textContent = msg;
		el.classList.add("show");
		clearTimeout(toast._t);
		toast._t = setTimeout(function () { el.classList.remove("show"); }, 2200);
	}

	function loadServers() {
		try {
			var raw = localStorage.getItem(SERVERS_KEY);
			return raw ? JSON.parse(raw) : [];
		} catch (e) {
			return [];
		}
	}

	function saveServers(list) {
		localStorage.setItem(SERVERS_KEY, JSON.stringify(list));
	}

	function normalizeAddr(addr) {
		addr = (addr || "").trim();
		if (!addr) return "";
		if (!/^wss?:\/\//i.test(addr)) addr = "wss://" + addr;
		return addr;
	}

	function getVersion() {
		var v = localStorage.getItem(VERSION_KEY);
		return VERSIONS[v] ? v : "1.12";
	}

	function setVersion(v) {
		if (!VERSIONS[v]) return;
		localStorage.setItem(VERSION_KEY, v);
		$("#sidebar-version-tag").textContent = VERSIONS[v].label + " · WASM-GC";
		$("#stat-version").textContent = VERSIONS[v].label;
	}

	// ---------- navigation ----------

	function showView(name) {
		$all(".view").forEach(function (v) { v.classList.toggle("active", v.id === "view-" + name); });
		$all(".nav-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.view === name); });
	}

	$all(".nav-btn").forEach(function (btn) {
		btn.addEventListener("click", function () { showView(btn.dataset.view); });
	});

	// ---------- server list rendering ----------

	function iconLetter(name) {
		return (name || "?").trim().charAt(0).toUpperCase() || "?";
	}

	function renderServers() {
		var list = loadServers();
		var container = $("#server-list");
		container.innerHTML = "";

		$("#stat-servers").textContent = String(list.length);

		if (list.length === 0) {
			var empty = document.createElement("div");
			empty.className = "empty-state";
			empty.textContent = "No servers saved yet. Add one below to get started.";
			container.appendChild(empty);
			return;
		}

		list.forEach(function (server) {
			var card = document.createElement("div");
			card.className = "server-card";

			var icon = document.createElement("div");
			icon.className = "server-icon";
			icon.textContent = iconLetter(server.name);

			var info = document.createElement("div");
			info.className = "server-info";
			var name = document.createElement("div");
			name.className = "server-name";
			name.textContent = server.name;
			var addr = document.createElement("div");
			addr.className = "server-addr";
			addr.textContent = server.addr;
			info.appendChild(name);
			info.appendChild(addr);

			var actions = document.createElement("div");
			actions.className = "server-actions";
			var del = document.createElement("button");
			del.className = "icon-btn danger";
			del.title = "Remove";
			del.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
			del.addEventListener("click", function (e) {
				e.stopPropagation();
				var next = loadServers().filter(function (s) { return s.id !== server.id; });
				saveServers(next);
				renderServers();
				toast("Server removed");
			});
			actions.appendChild(del);

			card.appendChild(icon);
			card.appendChild(info);
			card.appendChild(actions);

			card.addEventListener("click", function () { connect(server.addr); });

			container.appendChild(card);
		});
	}

	// ---------- add server form ----------

	var addForm = $("#add-server-form");

	$("#add-server-btn").addEventListener("click", function () {
		addForm.style.display = "block";
		$("#new-server-name").focus();
	});

	$("#cancel-server-btn").addEventListener("click", function () {
		addForm.style.display = "none";
		$("#new-server-name").value = "";
		$("#new-server-addr").value = "";
	});

	$("#save-server-btn").addEventListener("click", function () {
		var name = $("#new-server-name").value.trim();
		var addr = normalizeAddr($("#new-server-addr").value);

		if (!name) { toast("Enter a server name"); return; }
		if (!addr) { toast("Enter a server address"); return; }

		var list = loadServers();
		list.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), name: name, addr: addr });
		saveServers(list);
		renderServers();

		$("#new-server-name").value = "";
		$("#new-server-addr").value = "";
		addForm.style.display = "none";
		toast("Server saved");
	});

	// ---------- direct connect ----------

	$("#direct-connect-btn").addEventListener("click", function () {
		var addr = normalizeAddr($("#direct-addr").value);
		if (!addr) { toast("Enter a server address"); return; }
		connect(addr);
	});

	// ---------- version switcher ----------

	var versionSelect = $("#version-select");
	versionSelect.value = getVersion();
	setVersion(versionSelect.value);

	versionSelect.addEventListener("change", function () {
		setVersion(versionSelect.value);
		toast("Client set to Eaglercraft " + VERSIONS[versionSelect.value].label);
	});

	// ---------- quick play / dock launch ----------

	$("#quick-play").addEventListener("click", function () { connect(null); });
	$("#dock-launch").addEventListener("click", function () { connect(null); });

	// ---------- launch the engine ----------

	function connect(addr) {
		var launcher = $("#launcher");
		var frame = $("#game_frame");
		var back = $("#back-to-launcher");
		var version = VERSIONS[getVersion()];

		window.eaglercraftXOpts = {
			demoMode: false,
			container: "game_frame",
			assetsURI: version.assetsURI,
			worldsDB: "worlds",
			servers: loadServers().map(function (s) { return { addr: s.addr, name: s.name }; })
		};
		if (addr) window.eaglercraftXOpts.joinServer = addr;

		launcher.style.display = "none";
		frame.classList.add("active");
		back.classList.add("active");

		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = version.bootstrap;
		script.setAttribute("data-lowframe-engine", "1");
		script.onload = function () { window.main(); };
		document.head.appendChild(script);
	}

	$("#back-to-launcher").addEventListener("click", function () {
		window.location.reload();
	});

	// ---------- init ----------

	renderServers();
})();
