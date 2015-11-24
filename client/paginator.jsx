DefaultBootstrapPaginator = React.createClass({
    getDefaultProps: function() {
        return {
            containerClass: '',
            limit: 10,
            pagination: null
        };
    },

    getInitialState: function() {
        return {
            displayedPages: []
        };
    },

    componentWillMount: function () {
        this.setDisplayedPages(this.props);
    },

    componentWillReceiveProps: function (nextProps) {
        this.setDisplayedPages(nextProps);
    },

    getIntArray: function(min, max){
        var result = [];
        for (var i = min; i < max; ++i){
            result.push(i);
        }
        return result;
    },

    setDisplayedPages: function (props) {
        if (!props.pagination.ready()) {
            return;
        }

        var pageCount = props.pagination.totalPages(),
            current = props.pagination.currentPage();

        if (pageCount > props.limit){
            var min = 0;
            if (current > props.limit/2){
                if (current >  pageCount - props.limit/2){
                    min = pageCount - props.limit;
                }else{
                    min = Math.floor(current - props.limit/2);
                }
            }
            this.state.displayedPages = this.getIntArray(min + 1, min + 1 + props.limit);
        }else{
            this.state.displayedPages = this.getIntArray(1, pageCount + 1);
        }

        this.setState({
            displayedPages: this.state.displayedPages
        });
    },

    handleClickPage: function(page, event) {
        if (page > 0 && page <= this.props.pagination.totalPages()) {
            this.props.pagination.currentPage(page);
        }

        event.preventDefault();
    },

    handleClickShowPrevious: function(event) {
        var min = Math.max(1, this.state.displayedPages[0] - this.props.limit);

        this.state.displayedPages = this.getIntArray(min, min + this.props.limit);

        this.setState({
            displayedPages: this.state.displayedPages
        });

        event.preventDefault();
    },

    handleClickShowNext: function(event) {
        var pageCount = this.props.pagination.totalPages(),
            min = Math.min(pageCount - this.props.limit, this.state.displayedPages[this.state.displayedPages.length - 1]) + 1;

        this.state.displayedPages = this.getIntArray(min, min + this.props.limit);

        this.setState({
            displayedPages: this.state.displayedPages
        });

        event.preventDefault();
    },

    renderPage: function (page) {
        var liClass = "";

        if (this.props.pagination.currentPage() == page) {
            liClass = "active";
        }

        return (
            <li key={"page" + page} className={liClass}>
                <a href="#" className="page-link" title={"Go to page " + page} onClick={this.handleClickPage.bind(this, page)}> {page} </a>
            </li>
        );
    },

    renderFirstPage: function () {
        if (this.state.displayedPages.length && this.state.displayedPages[0] > 1) {
            return this.renderPage(1);
        }

        return null;
    },

    renderPreviousPages: function () {
        if (this.state.displayedPages.length && this.state.displayedPages[0] > 1) {
            return (
                <li>
                    <a href="#" className="show-prev" title="Show previous pages" onClick={this.handleClickShowPrevious}> ... </a>
                </li>
            );
        }

        return null;
    },

    renderNextPages: function () {
        if (this.state.displayedPages.length && this.state.displayedPages[this.state.displayedPages.length - 1] < this.props.pagination.totalPages()) {
            return (
                <li>
                    <a href="#" className="show-prev" title="Show next pages" onClick={this.handleClickShowNext}> ... </a>
                </li>
            );
        }

        return null;
    },

    renderLastPage: function () {
        if (this.state.displayedPages.length && this.state.displayedPages[this.state.displayedPages.length - 1] < this.props.pagination.totalPages()) {
            return this.renderPage(this.props.pagination.totalPages());
        }

        return null;
    },

    render: function() {
        var containerClass = "pagination-container";
        if (this.props.containerClass.length) {
            containerClass += " " + this.props.containerClass;
        }

        if (this.props.pagination && this.props.pagination.ready() && this.props.pagination.totalPages() > 1 && this.props.limit) {
            return (
                <div className={containerClass}>
                    <ul className="pagination">
                        <li className={this.props.pagination.currentPage() == 1 ? "disabled" : ""}>
                            <a href="#" className="previous-page" title="Previous page" onClick={this.handleClickPage.bind(this, this.props.pagination.currentPage() - 1)}> &lt; </a>
                        </li>
                        {this.renderFirstPage()}
                        {this.renderPreviousPages()}
                        {this.state.displayedPages.map(this.renderPage)}
                        {this.renderNextPages()}
                        {this.renderLastPage()}
                        <li className={this.props.pagination.currentPage() == this.props.pagination.totalPages() ? "disabled" : ""}>
                            <a href="#" className="next-page" title="Next page" onClick={this.handleClickPage.bind(this, this.props.pagination.currentPage() + 1)}> &gt; </a>
                        </li>
                    </ul>
                </div>
            );
        } else {
            return (<div className={containerClass}></div>);
        }
    }
});