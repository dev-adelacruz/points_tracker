class CreateHostBadges < ActiveRecord::Migration[8.1]
  def change
    create_table :host_badges do |t|
      t.references :user, null: false, foreign_key: true
      t.string :badge_key, null: false
      t.date :earned_on, null: false
      t.boolean :notified, null: false, default: false

      t.timestamps
    end

    add_index :host_badges, [ :user_id, :badge_key ], unique: true
  end
end
