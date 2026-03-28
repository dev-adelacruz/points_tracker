# frozen_string_literal: true

class HostCoinHistoryBlueprint < Blueprinter::Base
  identifier :id

  fields :coins

  field :session_id do |entry|
    entry.session_id
  end

  field :session_date do |entry|
    entry.session.date
  end

  field :session_slot do |entry|
    entry.session.session_slot == "slot_one" ? "first" : "second"
  end

  field :team_name do |entry|
    entry.session.team.name
  end
end
