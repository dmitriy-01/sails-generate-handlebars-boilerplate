/**
 * Created by Dmitriy on 2014-10-27.
 * @version 0.2.8
 */


//------------------------------------BASE------------------------------------

$(document).ready(function () {
  infoLoadEvent();
  listLoadEvent();
  formSubmitEvent();
  listPaginationEvent();
  listFiltersEvent();

  var timeout;
  $('.ajax-filter .ajax-input-type').on('keyup', function () {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(function () {
      listLoadEvent();
    }, 500);
  });
  $('.ajax-filter .ajax-input-click').on('click', function () {
    listLoadEvent();
  });
  if ($(".ajax-append").length > 0) {
    $(window).scroll(function () {
      if ($(window).scrollTop() >= $(document).height() - $(window).height() - 10) {
        console.log('loading more listLoadEvent');
        listLoadEvent();
      }
    });
  }

  $('.reload-ajax-info').click(function (event) {
    event.preventDefault();
    $(".ajax-info").html('');
    infoLoadEvent();
  });
});

(function (window, undefined) {
  var State = History.getState();
  History.log('initial:', State.data, State.title, State.url);
  History.Adapter.bind(window, 'statechange', function () {
    var State = History.getState();
    History.log('statechange:', State.data, State.title, State.url);
    listLoadEvent(false, true);
  });
})(window);


//-----------FORM-----------

function formSubmitEvent() {
  $('body').on("submit", "form.ajax-form", function (event) {
    event.preventDefault();

    var form = $(this);
    var actionUrl = form.attr('action');
    var formData = form.serializeObject();
    var callbackFunction = form.data('callback');

    $(".input-error", form).remove();
    $(".has-error", form).removeClass('has-error');

    //$('[type=submit]', form).last().isLoading({
    //  class: "fa fa-refresh fa-spin"
    //});
    $.isLoading({
      text: "Loading",
      class: "fa fa-refresh fa-spin"
    });

    $.ajax({
      type: "POST",
      url: actionUrl,
      data: formData
    }).done(function (resData, textStatus, jqXHR) {
      if (form.data('success-redirect')) {
        window.location.replace(form.data('success-redirect'));
      } else {
        form.trigger("reset");
        form.parents('.ajax-form-container').hide();
        listLoadEvent();
        if (callbackFunction && typeof window[callbackFunction] == 'function') {
          window[callbackFunction](resData);
        }
      }
    }).fail(function (jqXHR, textStatus, errorThrown) {
      switch (jqXHR.status) {
        case 302:
          window.location.replace(jqXHR.responseText);
          break;
        default:
          if (jqXHR.responseJSON && jqXHR.responseJSON.summary) {
            showAlert('danger', jqXHR.statusText + ': ' + jqXHR.responseJSON.summary);
          } else {
            showAlert('danger', jqXHR.statusText + ': ' + jqXHR.responseText);
          }

          if (jqXHR.responseJSON && jqXHR.responseJSON.invalidAttributes) {
            $.each(jqXHR.responseJSON.invalidAttributes, function (fieldIndex, field) {
              var fieldGroup = $("[name=" + fieldIndex + "]", form).parent();
              fieldGroup.addClass('has-error').addClass('state-error');
              $.each(field, function (errorIndex, error) {
                fieldGroup.append('<p class="text-danger input-error">' + error.message + '</p>');
              });
            });
          }
          break;
      }
    }).always(function (dataOrJqXHR) {
      //$('[type=submit]', form).last().isLoading("hide");
      $.isLoading( "hide" );
      console.log(dataOrJqXHR);
    });

  });

  $('body').on("click", "form.ajax-form .ajax-button", function (event) {
    event.preventDefault();

    var form = $(this).parents('form');
    var name = $(this).attr('name');
    var value = $(this).attr('value');
    form.children('input[name=' + name + ']').remove();
    form.append($("<input>").attr("type", "hidden").attr("name", name).val(value));

    form.submit();
  });
}

//-----------LIST-----------

function listLoadEvent(element, clear) {
  element = typeof element !== 'undefined' ? element : false;
  clear = typeof clear !== 'undefined' ? clear : false;

  $(".ajax-list").each(function (index) {
    var list = $(this);
    if (element && !element.is(list)) return true;

    var dataUrl = list.data('url');
    if (!dataUrl) return true;

    if (list.data('initial-load') == false && !clear) return true;

    if (!element && list.data('autoload') == 'no') return true;

    //var data = {};
    //data.where = list.data('where') || '{}';
    list.isLoading({
      class: "fa fa-refresh fa-spin"
    });

    var data = URI(History.getState().url).search(true);
    //dataUrl += search;

    if (list.hasClass('ajax-append')) {
      var existingItemsCount = list.children().not('.fa-spin').length;
      if (existingItemsCount > 0) {
        data.skip = existingItemsCount;
      }
    } else {
      data.skip = list.data('skip') || 0;
    }

    console.log('data:', data);

    $.ajax({
      type: "GET",
      url: dataUrl,
      data: data
    }).done(function (resData, textStatus, jqXHR) {
      switch (jqXHR.status) {
        case 200:
          if (!list.hasClass('ajax-append') || clear) {
            list.html('');
          }
          $.each(resData, function (index, value) {
            value.index = index;
            var templateHtml = JST["assets/templates/" + list.data('hb-tmpl') + ".handlebars"](value);
            list.append(templateHtml);
          });
          if (typeof listLoadCallback == 'function') {
            listLoadCallback();
          }
          if (list.data('callback') && typeof window[list.data('callback')] == 'function') {
            window[list.data('callback')](resData, list);
          }
          break;
        default:
          showAlert('danger', jqXHR);
          break;
      }
    }).fail(function (jqXHR, textStatus, errorThrown) {
      showAlert('danger', errorThrown);
    }).always(function () {
      list.isLoading("hide");
    });


    //Render pagination bar

    var pagination = (list.data('pagination-class')) ? $('.' + list.data('pagination-class')) : false;
    if (pagination) {
      var skip = list.data('skip') || 0;
      $('.ajax-count-from', pagination).html(skip);
      $('.ajax-count-to', pagination).html(skip + 10);

      var dataUrl = pagination.data('url');
      if (!dataUrl) return true;

      $.ajax({
        type: "GET",
        url: dataUrl,
        data: data
      }).done(function (resData, textStatus, jqXHR) {
        switch (jqXHR.status) {
          case 200:
            $('.ajax-count-total', pagination).html(resData);
            if (pagination.data('callback') && typeof window[pagination.data('callback')] == 'function') {
              window[pagination.data('callback')](resData, pagination);
            }
            break;
          default:
            showAlert('danger', jqXHR);
            break;
        }
      }).fail(function (jqXHR, textStatus, errorThrown) {
        showAlert('danger', errorThrown);
      }).always(function () {
        pagination.find('.fa-spin').hide();
      });
    }

    var count = (list.data('count-class')) ? $('.' + list.data('count-class')) : false;
    if (count) {

      var dataUrl = count.data('url');
      if (!dataUrl) return true;

      $.ajax({
        type: "GET",
        url: dataUrl,
        data: data
      }).done(function (resData, textStatus, jqXHR) {
        switch (jqXHR.status) {
          case 200:
            $(count).html(resData);
            break;
          default:
            showAlert('danger', jqXHR);
            break;
        }
      }).fail(function (jqXHR, textStatus, errorThrown) {
        showAlert('danger', errorThrown);
      }).always(function () {
        count.find('.fa-spin').hide();
      });
    }

  });

}

function listPaginationEvent() {
  $(".ajax-pagination").click(function (e) {
    e.preventDefault();
    var list = $('#' + $(this).data('list-id'));
    var skip = list.data('skip') || 0;
    if ($(this).data('direction') == 'next') {
      list.data('skip', skip + 10);
    } else if ($(this).data('direction') == 'prev') {
      list.data('skip', skip - 10);
    }
    listLoadEvent(list);
  });
}

function listFiltersEvent() {
  $('.ajax-filter').click(function () {
    var name = $(this).data('name');
    var value = $(this).data('value');

    if ($(this).attr('type') == 'checkbox') {
      $('.ajax-filter[data-name="' + name + '"]').not(this).prop('checked', false);
    }

    $(this).toggleClass("active");
    var active = $(this).hasClass("active");

    var newUrl = URI(History.getState().url).removeSearch(name);
    if (active) {
      newUrl = newUrl.addSearch(name, value);
    }
    $('.ajax-list').html('');
    History.pushState(null, null, newUrl.search());
  });

  $('.ajax-search').keyup(function () {
    var search = $(this);
    var name = $(this).attr('name') || 'q';
    delay(function () {
      var newUrl = URI(History.getState().url).removeSearch(name).addSearch(name, search.val());
      $('.ajax-list').html('');
      History.pushState(null, null, newUrl.search());
    }, 1000);
  });
}


//-----------INFO-----------

function infoLoadEvent() {
  $(".ajax-info").each(function (index) {
    var info = $(this);
    if (info.length == 0) return;

    var dataUrl = info.data('url');
    if (!dataUrl) return;

    var data = {};

    if (info.html().length == 0) {
      info.html('<i class="fa fa-refresh fa-spin"></i>');
    }

    $.ajax({
      type: "GET",
      url: dataUrl,
      data: data
    }).done(function (resData, textStatus, jqXHR) {
      switch (jqXHR.status) {
        case 200:
          if (info.data('hb-tmpl')) {
            var templateHtml = JST["assets/templates/" + info.data('hb-tmpl') + ".handlebars"](resData);
            info.append(templateHtml);
          } else {
            info.append(resData);
          }
          if (info.data('callback') && typeof window[info.data('callback')] == 'function') {
            window[info.data('callback')](resData);
          }
          break;
        default:
          showAlert('danger', jqXHR);
          break;
      }
    }).fail(function (jqXHR, textStatus, errorThrown) {
      showAlert('danger', errorThrown);
    }).always(function () {
      info.find('.fa-spin').hide();
    });
  });

}

//-----------HELPERS-----------

// function getWhereFilter(id) {
//   var filterForm = $(".ajax-filter[data-filter='" + id + "']");
//   if (filterForm.length == 0) return;
//
//   var formData = filterForm.serializeArray();
//   console.log('formData:', formData);
//
//   var where = {};
//   $.each(formData, function() {
//     if (this.value) {
//
//       var originalValue = this.value;
//
//       var nameArr = this.name.split(",");
//       if (nameArr.length > 1) {
//         var name = 'or';
//         var value = [];
//         $.each(nameArr, function(index, field) {
//           var condition = {};
//           condition[field] = {
//             'contains': originalValue
//           };
//           value.push(condition);
//         });
//       } else {
//         var value = {
//           'contains': originalValue
//         };
//         var name = this.name;
//         //                        value[this.name] = {
//         //                            'contains': originalValue
//         //                        };
//       }
//       //                where.push(value);
//
//       if (where[name] !== undefined) {
//         //                        if (!where[name].push) {
//         //                            where[name] = [where[this.name]];
//         //                        }
//         //                        where[name].push(value);
//       } else {
//         where[name] = value;
//       }
//     }
//   });
//
//   where = JSON.stringify(where);
//   return decodeURIComponent($.param(where));
// }

function showAlert(type, message) {
  if (message.summary) {
    message = message.summary;
  } else if (message.body) {
    message = message.body;
  }
  //    console.log('showAlert:', message);
  var templateHtml = JST["assets/templates/alert.handlebars"]({
    type: type,
    message: message
  });

  if ($("#ajax-alert").length > 0) {
    $("#ajax-alert").html(templateHtml);
  } else {
    alert(message);
  }


  // $('html, body').animate({
  //   scrollTop: $("#ajax-alert").offset().top
  // }, 500);

  setTimeout(function () {
    $("#ajax-alert").html('');
  }, 10000);
}

$.fn.serializeObject = function () {
  var o = {};
  var a = this.serializeArray();
  $.each(a, function () {
    if (o[this.name] !== undefined) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || '');
    } else {
      o[this.name] = this.value || '';
    }
  });
  return o;
};

var delay = (function () {
  var timer = 0;
  return function (callback, ms) {
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
  };
})();
