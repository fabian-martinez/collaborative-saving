from playwright.sync_api import Page, expect, sync_playwright

def test_login_redirect(page: Page):
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

    # Navigate to root, should redirect to login
    page.goto("http://localhost:5174/")

    # Wait for client-side redirect
    try:
        page.wait_for_url("**/login**", timeout=5000)
    except Exception as e:
        print(f"Wait for url failed: {e}")
        print(f"Current URL: {page.url}")

    # Check for login form elements
    # Using specific roles to avoid strict mode violation
    expect(page.get_by_role("heading", name="Login")).to_be_visible()
    expect(page.get_by_label("Email")).to_be_visible()
    expect(page.get_by_label("Password")).to_be_visible()
    expect(page.get_by_role("button", name="Login")).to_be_visible()

    # Take screenshot
    page.screenshot(path="verification/login_page.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_login_redirect(page)
        finally:
            browser.close()
