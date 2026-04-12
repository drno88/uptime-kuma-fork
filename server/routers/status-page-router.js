let express = require("express");
const apicache = require("../modules/apicache");
const { UptimeKumaServer } = require("../uptime-kuma-server");
const StatusPage = require("../model/status_page");
const { allowDevAllOrigin, sendHttpError } = require("../util-server");
const { R } = require("redbean-node");
const { badgeConstants } = require("../../src/util");
const { makeBadge } = require("badge-maker");
const { UptimeCalculator } = require("../uptime-calculator");
const jwt = require("jsonwebtoken");
const passwordHash = require("../password-hash");

let router = express.Router();

let cache = apicache.middleware;
const server = UptimeKumaServer.getInstance();

/**
 * Middleware: verify status page auth for non-public pages.
 * Attaches req.statusPage and req.statusPageVisibility.
 */
async function checkStatusPageAuth(req, res, next) {
    const slug = req.params.slug?.toLowerCase();
    if (!slug) return next();

    try {
        const statusPage = await R.findOne("status_page", " slug = ? ", [slug]);
        if (!statusPage) return next(); // let handler return 404

        req.statusPage = statusPage;
        const visibility = statusPage.visibility || "public";
        req.statusPageVisibility = visibility;

        if (visibility === "public") return next();

        const authHeader = req.headers["authorization"] || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ ok: false, visibility });
        }

        const decoded = jwt.verify(token, server.jwtSecret);

        if (visibility === "password") {
            if (decoded.statusPageSlug === slug && decoded.type === "statusPage") {
                return next();
            }
        } else if (visibility === "private") {
            if (decoded.id) {
                const user = await R.findOne("user", " id = ? ", [decoded.id]);
                if (user) return next();
            }
        }

        return res.status(401).json({ ok: false, visibility });
    } catch (e) {
        const visibility = req.statusPageVisibility || "public";
        return res.status(401).json({ ok: false, visibility });
    }
}

// Auth endpoint — password mode
router.post("/api/status-page/:slug/auth", express.json(), async (req, res) => {
    allowDevAllOrigin(res);
    try {
        const slug = req.params.slug.toLowerCase();
        const { password } = req.body;

        const statusPage = await R.findOne("status_page", " slug = ? ", [slug]);
        if (!statusPage) return res.status(404).json({ ok: false, msg: "Not found" });
        if ((statusPage.visibility || "public") !== "password") {
            return res.status(400).json({ ok: false, msg: "Not a password-protected page" });
        }
        if (!statusPage.password || !passwordHash.verify(password, statusPage.password)) {
            return res.status(401).json({ ok: false, msg: "Wrong password" });
        }

        const token = jwt.sign({ statusPageSlug: slug, type: "statusPage" }, server.jwtSecret, { expiresIn: "7d" });
        res.json({ ok: true, token });
    } catch (e) {
        res.status(500).json({ ok: false, msg: e.message });
    }
});

// Auth endpoint — private (user login) mode
router.post("/api/status-page/:slug/login", express.json(), async (req, res) => {
    allowDevAllOrigin(res);
    try {
        const slug = req.params.slug.toLowerCase();
        const { username, password } = req.body;

        const statusPage = await R.findOne("status_page", " slug = ? ", [slug]);
        if (!statusPage) return res.status(404).json({ ok: false, msg: "Not found" });
        if ((statusPage.visibility || "public") !== "private") {
            return res.status(400).json({ ok: false, msg: "Page is not in private mode" });
        }

        const user = await R.findOne("user", " username = ? ", [username]);
        if (!user || !passwordHash.verify(password, user.password)) {
            return res.status(401).json({ ok: false, msg: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user.id }, server.jwtSecret, { expiresIn: "7d" });
        res.json({ ok: true, token });
    } catch (e) {
        res.status(500).json({ ok: false, msg: e.message });
    }
});

// Public meta endpoint — returns only visibility so the frontend knows which login form to show
router.get("/api/status-page/:slug/visibility", async (req, res) => {
    allowDevAllOrigin(res);
    try {
        const slug = req.params.slug.toLowerCase();
        const statusPage = await R.findOne("status_page", " slug = ? ", [slug]);
        if (!statusPage) return res.status(404).json({ ok: false });
        res.json({ ok: true, visibility: statusPage.visibility || "public" });
    } catch (e) {
        res.status(500).json({ ok: false, msg: e.message });
    }
});

router.get("/status/:slug", async (request, response) => {
    let slug = request.params.slug;
    slug = slug.toLowerCase();
    await StatusPage.handleStatusPageResponse(response, server.indexHTML, slug);
});

router.get("/status/:slug/rss", async (request, response) => {
    let slug = request.params.slug;
    slug = slug.toLowerCase();
    await StatusPage.handleStatusPageRSSResponse(response, slug, request);
});

router.get("/status", async (request, response) => {
    let slug = "default";
    await StatusPage.handleStatusPageResponse(response, server.indexHTML, slug);
});

router.get("/status-page", async (request, response) => {
    let slug = "default";
    await StatusPage.handleStatusPageResponse(response, server.indexHTML, slug);
});

// Status page config, incident, monitor list
router.get("/api/status-page/:slug", checkStatusPageAuth, async (request, response) => {
    allowDevAllOrigin(response);
    let slug = request.params.slug;
    slug = slug.toLowerCase();

    try {
        let statusPage = request.statusPage || await R.findOne("status_page", " slug = ? ", [slug]);

        if (!statusPage) {
            sendHttpError(response, "Status Page Not Found");
            return null;
        }

        let statusPageData = await StatusPage.getStatusPageData(statusPage);

        response.json(statusPageData);
    } catch (error) {
        sendHttpError(response, error.message);
    }
});

// Status Page Polling Data
router.get("/api/status-page/heartbeat/:slug", checkStatusPageAuth, async (request, response) => {
    allowDevAllOrigin(response);

    try {
        let heartbeatList = {};
        let uptimeList = {};

        let slug = request.params.slug;
        slug = slug.toLowerCase();
        let statusPageID = await StatusPage.slugToID(slug);

        let monitorIDList = await R.getCol(
            `
            SELECT monitor_group.monitor_id FROM monitor_group, \`group\`
            WHERE monitor_group.group_id = \`group\`.id
            AND public = 1
            AND \`group\`.status_page_id = ?
        `,
            [statusPageID]
        );

        for (let monitorID of monitorIDList) {
            let list = await R.getAll(
                `
                    SELECT * FROM heartbeat
                    WHERE monitor_id = ?
                    ORDER BY time DESC
                    LIMIT 100
            `,
                [monitorID]
            );

            list = R.convertToBeans("heartbeat", list);
            heartbeatList[monitorID] = list.reverse().map((row) => row.toPublicJSON());

            const uptimeCalculator = await UptimeCalculator.getUptimeCalculator(monitorID);
            uptimeList[`${monitorID}_24`] = uptimeCalculator.get24Hour().uptime;
        }

        response.json({
            heartbeatList,
            uptimeList,
        });
    } catch (error) {
        sendHttpError(response, error.message);
    }
});

// Status page's manifest.json
router.get("/api/status-page/:slug/manifest.json", cache("1440 minutes"), async (request, response) => {
    allowDevAllOrigin(response);
    let slug = request.params.slug;
    slug = slug.toLowerCase();

    try {
        let statusPage = await R.findOne("status_page", " slug = ? ", [slug]);

        if (!statusPage) {
            sendHttpError(response, "Not Found");
            return;
        }

        response.json({
            name: statusPage.title,
            start_url: "/status/" + statusPage.slug,
            display: "standalone",
            icons: [
                {
                    src: statusPage.icon,
                    sizes: "128x128",
                    type: "image/png",
                },
            ],
        });
    } catch (error) {
        sendHttpError(response, error.message);
    }
});

router.get("/api/status-page/:slug/incident-history", checkStatusPageAuth, async (request, response) => {
    allowDevAllOrigin(response);

    try {
        let slug = request.params.slug;
        slug = slug.toLowerCase();
        let statusPageID = await StatusPage.slugToID(slug);

        if (!statusPageID) {
            sendHttpError(response, "Status Page Not Found");
            return;
        }

        const cursor = request.query.cursor || null;
        const result = await StatusPage.getIncidentHistory(statusPageID, cursor, true);
        response.json({
            ok: true,
            ...result,
        });
    } catch (error) {
        sendHttpError(response, error.message);
    }
});

// overall status-page status badge
router.get("/api/status-page/:slug/badge", cache("5 minutes"), async (request, response) => {
    allowDevAllOrigin(response);
    let slug = request.params.slug;
    slug = slug.toLowerCase();
    const statusPageID = await StatusPage.slugToID(slug);
    const {
        label,
        upColor = badgeConstants.defaultUpColor,
        downColor = badgeConstants.defaultDownColor,
        partialColor = "#F6BE00",
        maintenanceColor = "#808080",
        style = badgeConstants.defaultStyle,
    } = request.query;

    try {
        let monitorIDList = await R.getCol(
            `
            SELECT monitor_group.monitor_id FROM monitor_group, \`group\`
            WHERE monitor_group.group_id = \`group\`.id
            AND public = 1
            AND \`group\`.status_page_id = ?
        `,
            [statusPageID]
        );

        let hasUp = false;
        let hasDown = false;
        let hasMaintenance = false;

        for (let monitorID of monitorIDList) {
            let beat = await R.getAll(
                `
                    SELECT * FROM heartbeat
                    WHERE monitor_id = ?
                    ORDER BY time DESC
                    LIMIT 1
            `,
                [monitorID]
            );

            if (beat.length === 0) {
                continue;
            }
            if (beat[0].status === 3) {
                hasMaintenance = true;
            } else if (beat[0].status === 2) {
                // ignored
            } else if (beat[0].status === 1) {
                hasUp = true;
            } else {
                hasDown = true;
            }
        }

        const badgeValues = { style };

        if (!hasUp && !hasDown && !hasMaintenance) {
            badgeValues.message = "N/A";
            badgeValues.color = badgeConstants.naColor;
        } else {
            if (hasMaintenance) {
                badgeValues.label = label ? label : "";
                badgeValues.color = maintenanceColor;
                badgeValues.message = "Maintenance";
            } else if (hasUp && !hasDown) {
                badgeValues.label = label ? label : "";
                badgeValues.color = upColor;
                badgeValues.message = "Up";
            } else if (hasUp && hasDown) {
                badgeValues.label = label ? label : "";
                badgeValues.color = partialColor;
                badgeValues.message = "Degraded";
            } else {
                badgeValues.label = label ? label : "";
                badgeValues.color = downColor;
                badgeValues.message = "Down";
            }
        }

        const svg = makeBadge(badgeValues);

        response.type("image/svg+xml");
        response.send(svg);
    } catch (error) {
        sendHttpError(response, error.message);
    }
});

module.exports = router;
