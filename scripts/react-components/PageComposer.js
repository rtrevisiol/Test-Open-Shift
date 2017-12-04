/**
 * Created by ruggerotrevisiol on 14/02/17.
 */
import {FormFromUrl} from "./FormFromUrl";
import {Preventivo} from "./Preventivo";
import {DatiPersonali} from "./DatiPersonali";
import {Sinottico} from "./Sinottico";
import {Pagamento} from "./Pagamento";
import {Redirect} from "./Redirect";

import {Acquisto} from "./Acquisto";

import {MainScope} from  "../js-tools/MainScope";
const myComposer = {
  "FormFromUrl": FormFromUrl,
  "Preventivo": Preventivo,
  "Sinottico": Sinottico,
  "DatiPersonali": DatiPersonali,
  "Redirect": Redirect,
  "Pagamento": Pagamento,
  "Acquisto": Acquisto
};

export class PageComposer extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.scope = {
      "Componente": <div></div>,
      "campi": []
    }
  }
  render() {
    var self = this;
    var pagina = self.props.pagina;
    self.scope.Componente = <div></div>;
    if (pagina.sourceData) {
      if (pagina.sourceData.url) {
        self.scope.Componente = <FormFromUrl pagina={pagina} url={window.configApp[pagina.sourceData.url]}/>;
      } else if (pagina.sourceData.component) {
        var Component = myComposer[pagina.sourceData.component];
        var paginaCont = MainScope.get("pagina" + pagina.id);
        self.scope.Componente = <Component parametriUrl={this.props.parametri} pagina={pagina} data={pagina.id} content={paginaCont}/>
      }
    } else {
      self.scope.Componente = <div></div>;
    }
    return (<div className="pageComposer">
    {self.scope.Componente}
  </div>);
  }
}