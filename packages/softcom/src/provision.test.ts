import { describe, expect, it } from "vitest";
import { parseDeviceUrl } from "./provision";

describe("parseDeviceUrl", () => {
  const url =
    "https://selfhost.softcomservices.com/NHHskh/device/add?client_id=eebcd37e-c465-4b3e-b3ac-a177faaf3dfc&empresa_name=AUTO%20GIRO%20DISTRIBUI%C3%87%C3%83O%20DE%20CARGAS%20LTDA&empresa_cnpj=04289791000687&device_name=Metas";

  it("extracts url base and instance", () => {
    const p = parseDeviceUrl(url);
    expect(p.urlBase).toBe("https://selfhost.softcomservices.com/NHHskh");
    expect(p.instance).toBe("NHHskh");
  });

  it("extracts client_id and empresa data", () => {
    const p = parseDeviceUrl(url);
    expect(p.clientId).toBe("eebcd37e-c465-4b3e-b3ac-a177faaf3dfc");
    expect(p.empresaCnpj).toBe("04289791000687");
    expect(p.empresaName).toContain("AUTO GIRO");
    expect(p.deviceName).toBe("Metas");
  });

  it("falls back to device_id and default name", () => {
    expect(parseDeviceUrl("https://x.y/Z/device/add?client_id=a&device_id=Dev").deviceName).toBe("Dev");
    expect(parseDeviceUrl("https://x.y/Z/device/add?client_id=a").deviceName).toBe("Metas");
  });

  it("rejects non device/add urls", () => {
    expect(() => parseDeviceUrl("https://x.y/Z/api/funcionario")).toThrow();
  });

  it("rejects missing client_id", () => {
    expect(() => parseDeviceUrl("https://x.y/Z/device/add?empresa_cnpj=1")).toThrow();
  });
});
