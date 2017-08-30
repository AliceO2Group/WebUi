$.widget('o2.socketNotification', {
  generate: function(message) {
    if (window.Notification && Notification.permission !== 'denied') {
      Notification.requestPermission(function(status) {
        let n = new Notification(message.title, {
          body: message.message,
          icon: 'img/O2_logo.png'
        });
        setTimeout(n.close.bind(n), 3000);
      });
    }
  }
});
