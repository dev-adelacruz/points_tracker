# frozen_string_literal: true

class TeamBlueprint < Blueprinter::Base
  identifier :id

  fields :name, :description, :active, :host_count
end
