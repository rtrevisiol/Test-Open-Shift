/**
 * Created by ruggerotrevisiol on 30/01/17.
 */
import {MainScope} from  "../js-tools/MainScope";
export class MultiField extends React.Component {
    constructor(props) {
        super(props);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.change = this.change.bind(this);
        this.state = {
            campo: this.props.campo
        };
    }

    componentDidMount() {
        var campo = this.props.campo;
        var $el = $("#" + campo.father + "-" + campo.name).closest(".form-group");
        var input = $el.find("input");
    }

    onBlur() {
        return this.change()
    }

    change() {
        var self = this;
        var campo = this.props.campo;
        var $el = $("#" + campo.father + "-" + campo.name).closest(".form-group");
        var input = $el.find("input");

        var state = this.state;
        state.campo.value = input.val();
        var campo = state.campo;
        self.setState({"campo": campo});
        MainScope.setField(campo);
    }

    render() {
        var self = this;
        var campo = this.props.campo;
        var tipo = this.props.tipo;
        var returnValue;
        if (tipo == "label") {
            returnValue = (<span>
                           {campo.value}
                           </span>);
        } else {
            returnValue = (<span>
            <input type="text" id={campo.father + "-" + campo.name} className="form-control" name={campo.name}
                   onChange={this.change}
                   onBlur={this.onBlur.bind(this)}
                   autoComplete="off"
                   value={campo.value}
                   placeholder={campo.label}/>
                           </span>);
        }

        return returnValue;
    }
}
;