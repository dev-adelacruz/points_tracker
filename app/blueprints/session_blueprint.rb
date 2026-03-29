# frozen_string_literal: true

class SessionBlueprint < Blueprinter::Base
  identifier :id

  fields :date

  field :session_slot do |session|
    session.session_slot == "slot_one" ? "first" : "second"
  end

  field :team_id do |session|
    session.team_id
  end

  field :team_name do |session|
    session.team.name
  end

  field :created_by_id do |session|
    session.created_by_id
  end

  field :host_ids do |session|
    session.hosts.pluck(:id)
  end

  field :host_names do |session|
    session.hosts.pluck(:name)
  end
end
