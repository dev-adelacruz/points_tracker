class AddEmailNotificationsEnabledToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :email_notifications_enabled, :boolean, default: true, null: false
  end
end
