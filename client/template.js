Template.defaultBootstrapPagination.created = function(){
    var self = this;

    this.displayedPages = new ReactiveVar([]);

    if (!this.data.pagination) {
        return;
    }

    //auto slice displayedPages to fit in one line
    this.autorun(function(){
        if (!self.data.pagination.ready()) {
            return;
        }

        var pageCount = self.data.pagination.totalPages(),
            current = self.data.pagination.currentPage(),
            displayedPages;

        if (pageCount > self.data.limit){
            var min = 0;
            if (current > self.data.limit/2){
                if (current >  pageCount - self.data.limit/2){
                    min = pageCount - self.data.limit;
                }else{
                    min = Math.floor(current - self.data.limit/2);
                }
            }
            displayedPages = getIntArray(min + 1, min + 1 + self.data.limit);
        }else{
            displayedPages = getIntArray(1, pageCount + 1);
        }

        self.displayedPages.set(displayedPages);
    })
};

Template.defaultBootstrapPagination.helpers({
    hasPages: function () {
        return this.pagination && this.pagination.totalPages() > 1 && this.limit;
    },
    isActive : function(){
        return this.valueOf() == Template.instance().data.pagination.currentPage();
    },
    pagesToDisplay: function(){
        return Template.instance().displayedPages.get();
    },
    isInFirstPage: function () {
        return this.pagination.currentPage() == 1;
    },
    arePreviousPagesHidden: function () {
        var displayedPages = Template.instance().displayedPages.get();
        return displayedPages && displayedPages.length && displayedPages[0] > 1;
    },
    areNextPagesHidden: function () {
        var displayedPages = Template.instance().displayedPages.get();
        return displayedPages && displayedPages.length && (displayedPages[displayedPages.length - 1] < this.pagination.totalPages());

    },
    isInLastPage: function () {
        return this.pagination.currentPage() == this.pagination.totalPages();
    },
    lastPage: function(){
        return this.pagination.totalPages();
    }
});

Template.defaultBootstrapPagination.events({
    'click .page-link': function(e, templateInstance){
        templateInstance.data.pagination.currentPage(this.valueOf());
    },
    'click .previous-page': function(e, templateInstance){
        templateInstance.data.pagination.currentPage(templateInstance.data.pagination.currentPage() - 1);
    },
    'click .next-page': function(e, templateInstance){
        templateInstance.data.pagination.currentPage(templateInstance.data.pagination.currentPage() + 1);
    },
    'click .show-prev': function(e, templateInstance){
        var displayedPages = templateInstance.displayedPages.get(),
            min = Math.max(1, displayedPages[0] - templateInstance.data.limit);

        templateInstance.displayedPages.set(getIntArray(min, min + templateInstance.data.limit));
    },
    'click .show-next': function(e, templateInstance){
        var pageCount = templateInstance.data.pagination.totalPages(),
            displayedPages = templateInstance.displayedPages.get(),
            min = Math.min(pageCount - templateInstance.data.limit, displayedPages[displayedPages.length - 1]) + 1;

        templateInstance.displayedPages.set(getIntArray(min, min + templateInstance.data.limit));
    }
});

var getIntArray = function(min, max){
    var result = [];
    for (var i = min; i < max; ++i){
        result.push(i);
    }
    return result;
};