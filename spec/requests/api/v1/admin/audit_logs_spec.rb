# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Admin::AuditLogs" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }

  def create_log(actor:, action:, auditable:, label: nil, changes: {})
    AuditLog.create!(
      actor:          actor,
      action:         action,
      auditable_type: auditable.class.name,
      auditable_id:   auditable.id,
      auditable_label: label || auditable.try(:name),
      changes_data:   changes
    )
  end

  describe "#index" do
    path "/api/v1/admin/audit_logs" do
      get "returns paginated audit log entries" do
        tags "Admin::AuditLogs"
        produces "application/json"
        parameter name: :page, in: :query, type: :integer, required: false
        parameter name: :action_type, in: :query, type: :string, required: false
        parameter name: :resource_type, in: :query, type: :string, required: false
        parameter name: :date_from, in: :query, type: :string, required: false
        parameter name: :date_to, in: :query, type: :string, required: false

        let(:team) { create(:team) }

        response(200, "returns audit log entries") do
          before do
            create_log(actor: admin, action: "create", auditable: team, label: team.name)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data.length).to eq(1)
            expect(data.first[:action]).to eq("create")
            expect(data.first[:actor_name]).to eq(admin.name)
            expect(data.first[:resource_type]).to eq("Team")
            expect(data.first[:resource_label]).to eq(team.name)
            expect(json_response[:meta][:total]).to eq(1)
          end
        end

        response(200, "filters by action_type") do
          let(:action_type) { "deactivate" }

          before do
            create_log(actor: admin, action: "create", auditable: team)
            create_log(actor: admin, action: "deactivate", auditable: team)
            sign_in admin
          end

          run_test! do
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:action]).to eq("deactivate")
          end
        end

        response(200, "filters by resource_type") do
          let(:resource_type) { "Team" }
          let(:host) { create(:user, :host) }

          before do
            create_log(actor: admin, action: "create", auditable: team)
            create_log(actor: admin, action: "create", auditable: host)
            sign_in admin
          end

          run_test! do
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:resource_type]).to eq("Team")
          end
        end

        response(200, "filters by date range") do
          let(:date_from) { Date.current.to_s }
          let(:date_to)   { Date.current.to_s }

          before do
            old_log = AuditLog.create!(
              actor: admin, action: "create",
              auditable_type: "Team", auditable_id: team.id,
              changes_data: {}
            )
            old_log.update_columns(created_at: 2.weeks.ago)
            create_log(actor: admin, action: "update", auditable: team)
            sign_in admin
          end

          run_test! do
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:action]).to eq("update")
          end
        end

        response(403, "returns forbidden for non-admin") do
          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
