import Container from "typedi"
import API from "../api"
import { L3Provider, L4Provider } from "../interfaces/ILayer"

export default (l3Provider: L3Provider): L4Provider => {
    const l4Provider = Container.get<L4Provider>(API)
    l4Provider.SetLowerLayer(l3Provider)

    return l4Provider
}