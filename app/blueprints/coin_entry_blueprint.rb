# frozen_string_literal: true

class CoinEntryBlueprint < Blueprinter::Base
  identifier :id

  fields :coins

  field :session_id do |entry|
    entry.session_id
  end

  field :user_id do |entry|
    entry.user_id
  end

  field :host_email do |entry|
    entry.user.email
  end

  field :updated_at do |entry|
    entry.updated_at
  end

  field :edited do |entry|
    entry.edited?
  end
end
