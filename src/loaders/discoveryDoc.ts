import { readFileSync } from "fs";
import { IGoogleDiscoveryDoc, IFacebookDiscoveryDoc } from "../interfaces/IDiscoveryDoc";

const googleRawData = readFileSync(__dirname + '/../../googleDiscoveryDoc.json').toString()
export const googleDiscoveryDoc: IGoogleDiscoveryDoc = JSON.parse(googleRawData)

const facebookRawData = readFileSync(__dirname + '/../../facebookDiscoveryDoc.json').toString()
export const facebookDiscoveryDoc: IFacebookDiscoveryDoc = JSON.parse(facebookRawData)