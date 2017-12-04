/**
 * Created by ruggerotrevisiol on 30/01/17.
 */
import {MainScope} from  "../js-tools/MainScope";
export class NumberField extends React.Component {
    constructor(props) {
        super(props);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.change = this.change.bind(this);
        this.state = {
            campo: this.props.campo
        }
    }

    componentDidMount() {
        var self = this;
        var campo = this.props.campo;
        var nodo = document.getElementById(campo.father + "-" + campo.name);
        $(nodo).on("setField", function () {
            return self.change()
        });
        var $el = $(nodo).closest(".form-group");
        var input = $el.find("input");
    }

    onBlur() {
        return this.change()
    }

    change() {
        var self = this;
        var campo = this.props.campo;
        var nodo = document.getElementById(campo.father + "-" + campo.name);
        var $el = $(nodo).closest(".form-group");
        var input = $el.find("input");

        var state = this.state;
        if (!(isNaN(input.val()))) {
            state.campo.value = input.val();
        }

        var campo = state.campo;
        self.setState({"campo": campo});
        MainScope.setField(campo);
    }

    render() {
        var self = this;
        var campo = this.props.campo;
        if (!campo.maxLength) {
            campo.maxLength = 255;
        }
        return (<span>
            <input type="text" id={campo.father + "-" + campo.name} className="form-control" name={campo.name}
                   maxLength={campo.maxLength}
                   onChange={this.change}
                   onBlur={this.onBlur.bind(this)}
                   autoComplete="off"
                   value={campo.value}
                   placeholder={campo.label}/>
        </span>);
    }
}
;