import init, { convert, convert_as_string } from "../../mcp/pkg/mcp.js";


async function readSetting(): Promise<Object> {
    var response = await fetch("./setting.json");
    var obj = await response.json();
    return obj;
}
