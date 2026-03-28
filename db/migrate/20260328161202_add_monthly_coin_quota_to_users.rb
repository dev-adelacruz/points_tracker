class AddMonthlyCoinQuotaToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :monthly_coin_quota, :integer, default: 0, null: false
  end
end
