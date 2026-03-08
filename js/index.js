(function () {
    const _0x38ebc4 = function () {
        let _0x3e7f27 = true;
        return function (_0x4bb81e, _0x59d2b5) {
            const _0x1c9d03 = _0x3e7f27 ? function () {
                if (_0x59d2b5) {
                    const _0x2ad749 = _0x59d2b5.apply(_0x4bb81e, arguments);
                    _0x59d2b5 = null;
                    return _0x2ad749;
                }
            } : function () { };
            _0x3e7f27 = false;
            return _0x1c9d03;
        };
    }();

    const _0x342ac7 = _0x38ebc4(this, function () {
        const _0x481188 = function () {
            let _0x14e6f0;
            try {
                _0x14e6f0 = Function("return (function() {}.constructor(\"return this\")( ));")();
            } catch (_0x2e3e8f) {
                _0x14e6f0 = window;
            }
            return _0x14e6f0;
        };

        const _0x28561e = _0x481188();
        const _0x4cae25 = function () {
            return {
                key: "item",
                value: "attribute",
                setAttribute: function () { }
            };
        };

        _0x28561e.console = _0x4cae25();
    });

    _0x342ac7();

    document.addEventListener(
        (function (_0x3272d1) {
            return ["DOM", "Content", "Loaded"].join("");
        })(),
        function () {
            const _0x2a1ff1 = String.fromCharCode;
            const _0x4acbc7 = function (_0x5c97a5) {
                return _0x5c97a5
                    .split("")
                    .map((c) => _0x2a1ff1(c.charCodeAt(0)))
                    .join("");
            };

            const _url = _0x4acbc7("https://hzafznqoyinfjbqrrerp.supabase.co");
            const _key = _0x4acbc7(
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6YWZ6bnFveWluZmpicXJyZXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDYzMzcsImV4cCI6MjA3NjA4MjMzN30.qQFFQ6fzqBXxl63JG4JWNZ0JR0ZVnoyiU65J4VlDNG8"
            );

            const client = supabase.createClient(_url, _key);

            const form = document.getElementById("loginForm");
            const err = document.getElementById("errorMsg");
            const overlay = document.getElementById("loadingOverlay");

            const map = {
                admin: "pages/admin.html",
                sales: "pages/sales.html",
                er: "pages/er.html",
                ops: "pages/ops.html",
                fieldlds: "pages/field-lds.html",
                ld: "pages/ld.html",
            };

            form.addEventListener("submit", async function (_ev) {
                _ev.preventDefault();

                overlay.classList.add("active");
                err.classList.remove("show");

                const u = document.getElementById("username").value.trim();
                const p = document.getElementById("password").value.trim();

                if (!u || !p) {
                    overlay.classList.remove("active");
                    err.textContent = "Please enter both username and password.";
                    err.classList.add("show");
                    return;
                }

                try {
                    const { data: user, error } = await client
                        .from("users")
                        .select("*")
                        .eq("username", u)
                        .single();

                    if (error || !user) throw new Error("Invalid login credentials.");
                    if (user.password !== p)
                        throw new Error("Invalid login credentials.");

                    const target = map[user.role];
                    if (!target)
                        throw new Error("Dashboard for this role is not configured.");

                    sessionStorage.setItem("loggedIn", "true");
                    sessionStorage.setItem("role", user.role);
                    window.location.href = target;
                } catch (_e) {
                    overlay.classList.remove("active");
                    err.textContent = _e.message;
                    err.classList.add("show");
                }
            });
        }
    );
})();
