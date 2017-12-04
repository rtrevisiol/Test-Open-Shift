/**
 * Created by ruggerotrevisiol on 01/03/17.
 */
export class Loader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {"testo": this.props.testo};
    }

    componentDidMount() {

    }

    shouldComponentUpdate(propCh, stateCh) {
        var self = this;
        return true;
    }

    render() {
        var className = "", container = "";
        if (this.props.type == "loader") {
            className = "spinner";
            container = "";
        } else {
            className = "hidden";
            container = "large";
        }
        return (<div className="myLoader">
            <div className={"cont " + container}>
                {this.props.testo}<br/>
                <div className={className}>
                    <div className="rect1"></div>
                    <div className="rect2"></div>
                    <div className="rect3"></div>
                    <div className="rect4"></div>
                </div>
                <br/>
                <span id="textLoader"></span>
            </div>
        </div>);
    }
}