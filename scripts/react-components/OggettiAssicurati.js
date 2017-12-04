/**
 * Created by ruggerotrevisiol on 01/03/17.
 */
import {DinamicFieldSet} from "./DinamicFieldSet";
export class OggettiAssicurati extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.componentDidMount = this.componentDidMount.bind(this);
    this.state = {

    }
  }
  componentDidMount() {

  }
  render() {
    var assicurati = this.props.assicurati, parametri = [], righe = [], i;
    if (assicurati && assicurati.length > 0) {
      for (i in assicurati) {
        parametri = assicurati[i].parametri;
        righe.push(<DinamicFieldSet father={"oggettiAssicurati[" + i + "]"} key={i} campi={parametri}/>)
      }
    }
    return (
            <div>
              <fieldset className="oggettiAssicurati">
                <legend>Lista Assicurati</legend>
                {righe}
              </fieldset>
            </div>
            );
  }
}