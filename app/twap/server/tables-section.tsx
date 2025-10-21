import { getInfoTableData } from "../actions/get-info-table-data";
import { getPriceTableData } from "../actions/get-price-table-data";
import { getTableMeta, getTableRows } from "../actions/get-table-data";
import { getCachedSimulation, type TwapFormData } from "../actions/simulate-twap-action";
import { DataTable } from "../client/twap-fills-table";
import { TwapInfoTableWrapper } from "../client/twap-info-table-wrapper";
import { TwapPriceTableWrapper } from "../client/twap-price-table-wrapper";
import { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import { TwapParams } from "../lib/twap-server-client/api-types/twap";

export async function TablesSection({ formData }: { formData: TwapFormData }) {
    const result = await getCachedSimulation(formData);
    const simData = TwapSimulation.new({ strategies: result.simData });
    const twapParams = TwapParams.new(result.twapParams);

    const infoTableData = getInfoTableData(simData, twapParams);
    const priceTableData = getPriceTableData(simData, twapParams);
    const tableMeta = getTableMeta(twapParams);
    const tableRows = getTableRows(simData, twapParams);

    return (
        <>
            <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold ">TWAP Details</h3>
                <div className="flex gap-6">
                    <div className="border">
                        <TwapInfoTableWrapper data={infoTableData} />
                    </div>
                    <div className="border flex-1 self-start">
                        <TwapPriceTableWrapper data={priceTableData} />
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold ">Fills</h3>
                <DataTable meta={tableMeta} rows={tableRows} />
            </div>
        </>
    );
}
